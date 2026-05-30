import { defineConfig } from 'astro/config';

// In GitHub Actions, GITHUB_ACTIONS=true — apply the project-repo base path.
// Locally, base stays '/' so dev and local builds work without any prefix.
const base = process.env.GITHUB_ACTIONS ? '/portfolio' : '/';

export default defineConfig({
  site: 'https://agnesmercade.github.io',
  base,
});
