// Prefixes any root-relative path with Astro's configured base URL.
// Works correctly whether base is '/portfolio/' (GitHub Pages project site)
// or '/' (custom domain / local dev).
export const asset = (path: string): string =>
  import.meta.env.BASE_URL + path.replace(/^\//, '');
