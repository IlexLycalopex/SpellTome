// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// During the transition the new site is published under /next/ alongside the
// old static pages; at cutover SITE_BASE flips to '/'.
const base = process.env.SITE_BASE ?? '/next';

export default defineConfig({
  base,
  trailingSlash: 'ignore',
  integrations: [svelte()],
});
