import { mkdir, writeFile } from 'node:fs/promises';

const TOKEN = process.env.WEBFLOW_TOKEN;
if (!TOKEN) {
  console.error('Set WEBFLOW_TOKEN to a Webflow API token with read access.');
  process.exit(1);
}

const API = 'https://api.webflow.com/v2';

const COLLECTIONS = {
  'services':             '6952729d2807a37cc07c2ee6',
  'services-categories':  '6952729d2807a37cc07c2e54',
  'doctors':              '6952729d2807a37cc07c2e95',
  'staff':                '6952729d2807a37cc07c2ede',
  'blog':                 '6952729d2807a37cc07c2eb2',
  'blog-categories':      '6952729d2807a37cc07c2ec9',
  'locations':            '69836ad140ba845d94864ae5',
  'dates':                '69836ac7b9df763ecc149105',
  'practice-information': '6952729d2807a37cc07c2e80',
  'social-links':         '6952729d2807a37cc07c2e3a',
};

/** READ-ONLY. Never send a non-GET request to the Webflow API. */
async function getJson(path) {
  const res = await fetch(`${API}${path}`, {
    method: 'GET',
    headers: { authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function listAll(collectionId) {
  const items = [];
  let offset = 0;
  for (;;) {
    const page = await getJson(`/collections/${collectionId}/items?limit=100&offset=${offset}`);
    items.push(...page.items);
    offset += 100;
    if (offset >= (page.pagination?.total ?? items.length)) break;
  }
  return items;
}

/**
 * Per-collection item caps. Project owner's policy (2026-08-10): the blog is
 * capped to keep the repo light. Without this, a re-sync silently restores all
 * ~28 published posts and quietly discards the policy.
 */
const ITEM_CAPS = { blog: 2 };

for (const [name, id] of Object.entries(COLLECTIONS)) {
  const dir = `src/content/${name}`;
  await mkdir(dir, { recursive: true });

  let items = (await listAll(id)).filter((item) => !item.isArchived && !item.isDraft);

  const cap = ITEM_CAPS[name];
  if (cap !== undefined && items.length > cap) {
    items = items
      .sort((a, b) => String(b.lastPublished ?? '').localeCompare(String(a.lastPublished ?? '')))
      .slice(0, cap);
    console.warn(`${name}: capped to ${cap} most recent item(s) per ITEM_CAPS`);
  }

  const seen = new Set();
  for (const item of items) {
    const data = { id: item.id, lastPublished: item.lastPublished ?? null, ...item.fieldData };
    if (!data.slug) throw new Error(`${name}: item ${item.id} has no slug`);
    if (seen.has(data.slug)) throw new Error(`${name}: duplicate slug "${data.slug}"`);
    seen.add(data.slug);
    await writeFile(`${dir}/${data.slug}.json`, JSON.stringify(data, null, 2), 'utf8');
  }
  console.log(`${name}: ${items.length} item(s)`);
}
