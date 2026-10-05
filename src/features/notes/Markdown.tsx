import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import markedFootnote from 'marked-footnote';
import { memo, useEffect, useMemo, useState, type MouseEvent } from 'react';

// Links in notes open in a new tab so following one never unloads the app. In-note anchors stay put.
DOMPurify.addHook('afterSanitizeAttributes', node => {
  const href = node.tagName === 'A' && node.getAttribute('href');
  if (href && !href.startsWith('#')) { node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer'); }
});

/** Set once the lazy highlighter chunk has loaded; until then fenced code renders plain. */
let highlighter: typeof import('@/features/notes/highlight').highlight | null = null;
let loading: Promise<void> | null = null;

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const slugs = new Map<string, number>();
const slugify = (text: string) => text.replace(/<[^>]*>/g, '').toLowerCase().replace(/&[#\w]+;/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s+/g, '-');

const md = new Marked({ gfm: true }, markedFootnote(), {
  renderer: {
    // GitHub-style ids: prefixed so a heading can't clobber DOM globals (DOMPurify strips those), linked by the bare slug.
    heading({ tokens, depth }) {
      const base = slugify(this.parser.parseInline(tokens, this.parser.textRenderer)) || 'section', n = slugs.get(base) ?? 0;
      const slug = n ? `${base}-${n}` : base;
      slugs.set(base, n + 1);
      return `<h${depth} id="user-content-${slug}">${this.parser.parseInline(tokens)}<a class="heading-anchor" href="#${slug}" aria-label="Link to this section">#</a></h${depth}>\n`;
    },
    code({ text, lang }) {
      const language = (lang || '').match(/^[\w+#-]+/)?.[0].toLowerCase() ?? '';
      const html = highlighter?.(text, language);
      return html == null ? false : `<pre><code class="hljs language-${escapeHtml(language)}">${html}</code></pre>\n`;
    },
  },
});

/** Markdown → sanitised HTML. Note content is user input, so DOMPurify always runs, highlighted code included. */
export function renderMarkdown(source: string) {
  slugs.clear();
  return DOMPurify.sanitize(md.parse(source, { async: false }));
}

const hasFencedCode = (source: string) => /^ {0,3}(`{3,}|~{3,})[ \t]*[\w+#-]/m.test(source);

/** Pulls in the highlighter chunk the first time a note with a fenced, labelled code block is shown. */
function useHighlighter(needed: boolean) {
  const [ready, setReady] = useState(Boolean(highlighter));
  useEffect(() => {
    if (!needed || highlighter) return;
    let live = true;
    (loading ??= import('@/features/notes/highlight').then(m => { highlighter = m.highlight; }, () => { loading = null; }))
      .then(() => { if (live && highlighter) setReady(true); });
    return () => { live = false; };
  }, [needed]);
  return ready && needed;
}

/** In-note links (headings, footnotes) scroll within the note instead of touching the app URL. */
function followAnchor(e: MouseEvent<HTMLDivElement>) {
  const link = (e.target as Element).closest?.('a[href^="#"]');
  if (!link) return;
  e.preventDefault();
  const id = decodeURIComponent(link.getAttribute('href')!.slice(1));
  const target = e.currentTarget.querySelector(`[id="${CSS.escape(`user-content-${id}`)}"], [id="${CSS.escape(id)}"]`);
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Rendered note body. Wrapping is purely CSS (`.markdown-body`); the source text is never rewritten. */
export const Markdown = memo(function Markdown({ source, className = '', empty = '', inert }: { source: string; className?: string; empty?: string; inert?: boolean }) {
  const highlighted = useHighlighter(hasFencedCode(source));
  const html = useMemo(() => renderMarkdown(source), [source, highlighted]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className={`markdown-body ${className}`} inert={inert} onClick={inert ? undefined : followAnchor} dangerouslySetInnerHTML={{ __html: html || (empty && `<p>${empty}</p>`) }}/>;
});
