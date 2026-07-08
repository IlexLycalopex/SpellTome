/**
 * BASE_URL-aware link helper. The site deploys under /next/ during the
 * transition and / after cutover, so every internal href must go through
 * here (enforced by the link-crawl test).
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function href(path: string): string {
  if (!path.startsWith('/')) path = '/' + path;
  return `${base}${path}`;
}
