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

for (const [name, id] of Object.entries(COLLECTIONS)) {
  const dir = `src/content/${name}`;
  await mkdir(dir, { recursive: true });
  const items = await listAll(id);
  for (const item of items) {
    if (item.isArchived || item.isDraft) continue;
    const data = { id: item.id, lastPublished: item.lastPublished ?? null, ...item.fieldData };
    await writeFile(`${dir}/${data.slug}.json`, JSON.stringify(data, null, 2), 'utf8');
  }
  console.log(`${name}: ${items.length} item(s)`);
}
