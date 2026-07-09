import { marked } from 'marked';
import DOMPurify from 'dompurify';

/** Render untrusted markdown (play logs) to sanitized HTML. */
export function renderMarkdown(md: string): string {
  const html = marked.parse(md, { async: false, gfm: true, breaks: true });
  return DOMPurify.sanitize(html);
}
