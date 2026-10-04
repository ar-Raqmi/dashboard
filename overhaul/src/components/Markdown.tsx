import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { memo, useMemo } from 'react';

// Links in notes open in a new tab so following one never unloads the app.
DOMPurify.addHook('afterSanitizeAttributes', node => {
  if (node.tagName === 'A' && node.getAttribute('href')) { node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer'); }
});

/** Markdown → sanitised HTML. Note content is user input, so DOMPurify always runs. */
export function renderMarkdown(source: string) {
  return DOMPurify.sanitize(marked.parse(source, { async: false }));
}

/** Rendered note body. Wrapping is purely CSS (`.markdown-body`); the source text is never rewritten. */
export const Markdown = memo(function Markdown({ source, className = '', empty = '', inert }: { source: string; className?: string; empty?: string; inert?: boolean }) {
  const html = useMemo(() => renderMarkdown(source), [source]);
  return <div className={`markdown-body ${className}`} inert={inert} dangerouslySetInnerHTML={{ __html: html || (empty && `<p>${empty}</p>`) }}/>;
});
