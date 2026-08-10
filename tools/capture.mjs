import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const OUT = 'tools/snapshots';
const UA = 'Mozilla/5.0 (compatible; vimg-replica/1.0)';

const [slug, url] = process.argv.slice(2);
if (!slug || !url) {
  console.error('Usage: node tools/capture.mjs <slug> <url>');
  process.exit(1);
}

await mkdir(OUT, { recursive: true });

const html = await (await fetch(url, { headers: { 'user-agent': UA } })).text();
await writeFile(join(OUT, `${slug}.html`), html, 'utf8');

const hrefs = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map((m) => m[1]);
let css = '';
for (const href of hrefs) {
  const abs = href.startsWith('http') ? href : new URL(href, url).toString();
  css += `\n/* ===== ${abs} ===== */\n`;
  css += await (await fetch(abs, { headers: { 'user-agent': UA } })).text();
}
await writeFile(join(OUT, `${slug}.css`), css, 'utf8');

console.log(`Captured ${slug}: ${html.length} bytes HTML, ${css.length} bytes CSS from ${hrefs.length} stylesheet(s)`);
