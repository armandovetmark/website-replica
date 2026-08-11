import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const UA = 'Mozilla/5.0 (compatible; vimg-replica/1.0)';

/**
 * A trailing ")" is ambiguous: CSS writes url(https://…/x.svg) so that paren
 * terminates the URL, but Webflow's duplicate-upload suffix "%20(1).png" contains
 * a balanced pair that belongs to the filename. A simple "does it end in )"
 * check isn't enough either — minified CSS glues url(...)format(...) together
 * with no whitespace (seen for real in tools/snapshots/home.css's @font-face
 * rule), so the match can run on past the wrapper's ")" with balanced paren
 * *counts* but the wrong *order*. Any "(" that legitimately opens the CSS
 * wrapper is always before the match (matching starts at "https://"), so within
 * the matched substring paren depth should never go negative — the first place
 * it would is the true end of the URL; anything from there on is CSS syntax.
 */
function trimTrailingDelimiters(url) {
  let depth = 0;
  for (let i = 0; i < url.length; i++) {
    if (url[i] === '(') depth++;
    else if (url[i] === ')') {
      if (depth === 0) return url.slice(0, i).replace(/[.,;:]+$/, '');
      depth--;
    }
  }
  return url.replace(/[.,;:]+$/, '');
}

export function collectAssetUrls(text) {
  // Decode entities BEFORE matching: an attribute written as &quot;…&quot; would
  // otherwise leak the entity into the match and produce a 404/403 URL.
  const decoded = text
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&amp;/g, '&');
  // Comma is a delimiter: srcset and data-video-urls join multiple URLs with it.
  // ; { } are also excluded: minified CSS abuts a url(...) directly against the
  // next declaration with no whitespace (e.g. "url(...svg);background-position:
  // 50%;background-size:32px"), and none of those three characters ever
  // legitimately appear in a Webflow asset filename, so — unlike ")" — they don't
  // need the balanced-pair treatment in trimTrailingDelimiters below. Verified
  // against the real tools/snapshots/home.css .callbar-phone rule, which is
  // exactly this shape.
  const re = /https:\/\/cdn\.prod\.website-files\.com\/[^"'\s\\,;{}]+/g;
  return [...new Set((decoded.match(re) ?? []).map(trimTrailingDelimiters))];
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
  const used = new Map(); // local filename -> source URL that claimed it
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA } });
      if (!res.ok) { console.warn(`SKIP ${url} → ${res.status}`); continue; }

      // Resolve the name only after a successful fetch, so a skipped URL never
      // reserves a name or reports a collision that did not happen.
      let name = localNameFor(url);
      if (used.has(name) && used.get(name) !== url) {
        // Two distinct assets reduce to the same name once the 24-hex prefix is
        // stripped. Keep BOTH — silently overwriting loses a real image.
        const id = (new URL(url).pathname.match(/([0-9a-f]{24})_/)?.[1] ?? '').slice(0, 8);
        const ext = extname(name);
        name = `${name.slice(0, name.length - ext.length)}-${id}${ext}`;
        console.warn(`COLLISION ${url} → disambiguated as ${name}`);
      }
      used.set(name, url);

      const isVector = extname(name).toLowerCase() === '.svg';
      const dest = isVector ? join('public/icons', name) : join('src/assets', name);
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
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
