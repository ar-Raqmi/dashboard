import { Zip, ZipPassThrough } from 'fflate';

export interface ZipEntry {
  /** Path inside the archive, `/`-separated. A trailing `/` makes it an (empty) directory entry. */
  path: string;
  modified?: number;
  /** Resolves to the file's bytes, or null when the object is missing from storage. */
  open?: () => Promise<ReadableStream<Uint8Array> | null>;
}

/**
 * Streams a ZIP archive built from `entries`. Files are stored uncompressed (most uploads are already compressed, and
 * skipping deflate keeps CPU flat on the edge), and each is piped chunk by chunk, so memory stays bounded however large
 * the selection is. Awaiting every write gives the client's download speed natural back-pressure.
 * Entries that cannot be read are skipped and listed in a trailing `_MISSING_FILES.txt`.
 */
export function streamZip(entries: ZipEntry[]): ReadableStream<Uint8Array> {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  let pending: Uint8Array[] = [];
  let failure: unknown = null;
  const zip = new Zip((err, chunk) => { if (err) failure = err; else pending.push(chunk); });
  const flush = async () => {
    if (failure) throw failure;
    const chunks = pending;
    pending = [];
    for (const chunk of chunks) await writer.write(chunk);
  };

  void (async () => {
    const missing: string[] = [];
    try {
      for (const entry of entries) {
        const file = new ZipPassThrough(entry.path);
        if (entry.modified) file.mtime = entry.modified;
        if (!entry.open) { zip.add(file); file.push(new Uint8Array(0), true); await flush(); continue; }
        const body = await entry.open();
        if (!body) { missing.push(entry.path); continue; }
        zip.add(file);
        const reader = body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) { file.push(new Uint8Array(0), true); break; }
          file.push(value);
          await flush();
        }
        await flush();
      }
      if (missing.length) {
        const note = new ZipPassThrough('_MISSING_FILES.txt');
        zip.add(note);
        note.push(new TextEncoder().encode(`These files could not be read from storage and are not in this archive:\n\n${missing.join('\n')}\n`), true);
      }
      zip.end();
      await flush();
      await writer.close();
    } catch (err) {
      await writer.abort(err).catch(() => undefined);
    }
  })();
  return readable;
}
