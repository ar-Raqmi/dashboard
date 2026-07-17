// Lazy-loads pdf.js (client-only) and configures its worker from a CDN
// matching the installed version, so it never bloats the main bundle.

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
      return pdfjs
    })
  }
  return pdfjsPromise
}
