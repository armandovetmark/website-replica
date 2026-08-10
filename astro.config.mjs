import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.veterinaryimgroup.com',
  output: 'static',
  build: { format: 'directory' },
});
