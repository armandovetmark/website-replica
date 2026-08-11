import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const CDN = 'https://cdn.prod.website-files.com';
const UA = 'Mozilla/5.0 (compatible; vimg-replica/1.0)';

export function collectAssetUrls(text) {
  const re = new RegExp(`${CDN.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}/[^"')\\s\\\\]+`, 'g');
  return [...new Set((text.match(re) ?? []).map((u) => u.replace(/&amp;/g, '&')))];
}

/** Webflow prefixes uploads with a 24-char hex id; strip it for readable filenames. */
export function localNameFor(url) {
  const raw = decodeURIComponent(basename(new URL(url).pathname));
  const stripped = raw.replace(/^[0-9a-f]{24}_/, '');
  // Some Webflow URLs (background-video data attributes) encode a folder separator
  // as %2F inside what looks like a single path segment. decodeURIComponent turns
  // that into a literal "/", which would make writeFile() below try to create a
  // nested path (ENOENT on Windows, since parent dirs aren't auto-created). Replace
  // that and other filesystem-unsafe characters so the result is always a flat,
  // Windows-safe filename.
  return stripped.replace(/[\\/:*?"<>|]/g, '-');
}

async function main() {
  const sources = [];
  for (const f of await readdir('tools/snapshots').catch(() => [])) {
    // The captured snapshot is home.html *and* home.css (see task inputs) — some
    // assets (e.g. the CallBar phone icon) are only referenced via CSS
    // `background-image: url(...)`, never as an <img src> in the HTML.
    if (f.endsWith('.html') || f.endsWith('.css')) {
      sources.push(await readFile(join('tools/snapshots', f), 'utf8'));
    }
  }
  for (const dir of await readdir('src/content').catch(() => [])) {
    for (const f of await readdir(join('src/content', dir))) {
      sources.push(await readFile(join('src/content', dir, f), 'utf8'));
    }
  }

  const urls = collectAssetUrls(sources.join('\n'));
  await mkdir('src/assets', { recursive: true });
  await mkdir('public/icons', { recursive: true });

  const map = {};
  const writtenBy = new Map(); // local name -> source URL that already claimed it
  for (const url of urls) {
    try {
      const name = localNameFor(url);
      const isVector = extname(name).toLowerCase() === '.svg';
      const dest = isVector ? join('public/icons', name) : join('src/assets', name);
      // Two different Webflow uploads can reduce to the same name once the hex id
      // prefix is stripped. Don't let the second one silently overwrite the first —
      // report it so it can be resolved deliberately.
      if (writtenBy.has(name)) {
        console.warn(`COLLISION ${name}: ${writtenBy.get(name)} was already written here; ${url} will overwrite it`);
      }
      const res = await fetch(url, { headers: { 'user-agent': UA } });
      if (!res.ok) { console.warn(`SKIP ${url} → ${res.status}`); continue; }
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      writtenBy.set(name, url);
      map[url] = isVector ? `/icons/${name}` : `~/assets/${name}`;
    } catch (err) {
      // One malformed/unreachable URL should not abort the whole mirror run.
      console.warn(`SKIP ${url} → ${err.message}`);
    }
  }

  await writeFile('tools/snapshots/asset-map.json', JSON.stringify(map, null, 2), 'utf8');
  console.log(`Mirrored ${Object.keys(map).length} of ${urls.length} asset(s)`);
}

// Cross-platform entry-point check. The brief's `file://${process.argv[1]}` comparison
// never matches on Windows (process.argv[1] uses backslashes; import.meta.url is a
// percent-encoded file:/// URL), which silently skips main(). pathToFileURL() normalizes
// both sides so this works on Windows, macOS, and Linux alike. Guard against
// process.argv[1] being unset (e.g. the module is imported rather than run directly).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
