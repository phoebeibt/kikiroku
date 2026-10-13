"""One-off dedupe of the sake reference tables (2026-10-13, user-approved).
Usage: python3 dedupe.py            # dry run: prints the plan
       python3 dedupe.py --apply    # re-links first, deletes last, then verifies counts
Backup taken before: backups/2026-10-13-before-dedupe/ (+ a fresh one in backups/2026-10-13-apply/)."""
import json, re, sys, unicodedata, urllib.request, urllib.parse, collections, os
env = dict(l.strip().split('=', 1) for l in open(os.path.expanduser('~/kikiroku/.env.local')) if '=' in l)
URL = env['VITE_SUPABASE_URL'].rstrip('/') + '/rest/v1/'; KEY = env['SUPABASE_SERVICE_ROLE_KEY']
APPLY = '--apply' in sys.argv

def call(method, path, body=None, prefer=None):
    h = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'}
    if prefer: h['Prefer'] = prefer
    req = urllib.request.Request(URL + path, method=method, headers=h, data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req) as r:
        t = r.read(); return json.loads(t) if t else None

def fetch(table):
    rows, start = [], 0
    while True:
        h = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Range': f'{start}-{start+999}'}
        with urllib.request.urlopen(urllib.request.Request(URL + f'{table}?select=*&order=id', headers=h)) as r: b = json.load(r)
        rows += b
        if len(b) < 1000: return rows
        start += 1000

def norm(s):
    s = unicodedata.normalize('NFKC', s or '').lower()
    return re.sub(r'[\s　・･·\-‐ー―〜~「」『』()（）\[\]【】"\'”“]', '', s)
sid = lambda p: int(re.search(r'/(\d+)/?$', p['source_url'] or '/999999/').group(1))

tables = {t: fetch(t) for t in ['sake_products', 'sake_breweries', 'sake_brands', 'sake_awards', 'sake_entries', 'sake_wishes']}
if APPLY:
    out = os.path.expanduser('~/kikiroku/backups/2026-10-13-apply/'); os.makedirs(out, exist_ok=True)
    for t, rows in tables.items(): json.dump(rows, open(out + t + '.json', 'w'), ensure_ascii=False)
P = tables['sake_products']

# ── products: exact (brewery+name) groups, plus the user-confirmed 奥播磨 生 / 生酒 pair
groups = collections.defaultdict(list)
for p in P: groups[(norm(p['brewery_name']), norm(p['name']))].append(p)
plan = [sorted(v, key=sid) for v in groups.values() if len(v) > 1]
oku = sorted([p for p in P if p['brewery_name'] == '下村酒造店' and p['name'] in ('奥播磨 純米おりがらみ 生', '奥播磨 純米おりがらみ 生酒')], key=sid)
if len(oku) == 2: plan.append(oku)
FIELDS = ['region', 'type', 'rice', 'yeast', 'polishing', 'alcohol', 'smv', 'acidity', 'name_romaji', 'name_zh', 'brewery_id']
prod_patch, prod_delete, relink_entries, relink_wishes = [], [], [], []
for g in plan:
    keep, extra = g[0], g[1:]
    fill = {f: next((x[f] for x in extra if x[f] not in (None, '')), None) for f in FIELDS if keep[f] in (None, '')}
    fill = {k: v for k, v in fill.items() if v is not None}
    if fill: prod_patch.append((keep, fill))
    for x in extra:
        prod_delete.append((x, keep))
        relink_entries += [(e['id'], keep['id']) for e in tables['sake_entries'] if e['product_id'] == x['id']]
        relink_wishes += [(w['id'], keep['id']) for w in tables['sake_wishes'] if w['product_id'] == x['id']]

# ── breweries (keep ← merge), user-confirmed
BREW = [(397, 1445), (907, 956), (1511, 1497), (1681, 1757), (658, 1803)]
W = {w['id']: w for w in tables['sake_breweries']}
brew_relink = {t: [(r['id'], k) for k, d in BREW for r in tables[t] if r.get('brewery_id') == d] for t in ['sake_brands', 'sake_awards', 'sake_products']}

# ── awards exact duplicate
seen, award_delete = {}, []
for a in sorted(tables['sake_awards'], key=lambda a: str(a['created_at']) + str(a['id'])):
    k = (a['year'], norm(a['brand_name']), norm(a['brewery_name']), a['is_gold'], a['brand_id'], a['brewery_id'])
    if k in seen: award_delete.append(a)
    else: seen[k] = a

print(f'products: {len(plan)} groups, patch {len(prod_patch)}, delete {len(prod_delete)}, relink entries {len(relink_entries)}, wishes {len(relink_wishes)}')
for keep, fill in prod_patch: print('  fill', keep['name'], fill)
for x, keep in prod_delete: print(f"  delete #{sid(x)} {x['name']} → keep #{sid(keep)}")
print('breweries:', [(W[k]['name'], '←', W[d]['name']) for k, d in BREW])
for t, rows in brew_relink.items(): print(f'  relink {t}: {len(rows)}')
print('awards delete:', [(a['year'], a['brand_name'], a['brewery_name']) for a in award_delete])
expect = {'sake_products': len(P) - len(prod_delete), 'sake_breweries': len(W) - len(BREW), 'sake_awards': len(tables['sake_awards']) - len(award_delete)}
print('expected counts after:', expect)
if not APPLY: sys.exit()

inlist = lambda ids: 'in.(' + ','.join(str(i) for i in ids) + ')'
# 1. fill gaps on kept products, re-link anything pointing at doomed rows
for keep, fill in prod_patch: call('PATCH', f"sake_products?id=eq.{keep['id']}", fill)
for eid, pid in relink_entries: call('PATCH', f'sake_entries?id=eq.{eid}', {'product_id': pid})
for wid, pid in relink_wishes: call('PATCH', f'sake_wishes?id=eq.{wid}', {'product_id': pid})
for k, d in BREW:
    for t in brew_relink: call('PATCH', f'{t}?brewery_id=eq.{d}', {'brewery_id': k})
# 2. delete last
call('DELETE', 'sake_products?id=' + inlist([x['id'] for x, _ in prod_delete]))
call('DELETE', 'sake_breweries?id=' + inlist([d for _, d in BREW]))
if award_delete: call('DELETE', 'sake_awards?id=' + inlist([a['id'] for a in award_delete]))
# 3. verify
for t, n in expect.items():
    got = len(fetch(t)); print(f'{t}: {got} (expected {n})', 'OK' if got == n else 'MISMATCH')
left = sum(1 for t in ['sake_brands', 'sake_awards', 'sake_products'] for r in fetch(t) if r.get('brewery_id') in {d for _, d in BREW})
print('rows still pointing at merged breweries:', left)
