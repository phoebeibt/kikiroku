"""Link マイ帳 records to 事典 products (2026-10-13, user-approved).
1. Same sake already in the catalogue (exact / same words in another order / hand-confirmed) → link.
2. Public records with no catalogue match → contribute a new product (what the app does on save), then link.
   Identical sakes recorded more than once share one product.
3. Private records with no match → left alone (their names would become public in 事典).
Usage: python3 link_entries.py [--apply]"""
import json, os, re, sys, unicodedata, collections, urllib.request
env = dict(l.strip().split('=', 1) for l in open(os.path.expanduser('~/kikiroku/.env.local')) if '=' in l)
URL = env['VITE_SUPABASE_URL'].rstrip('/') + '/rest/v1/'; KEY = env['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'}
USER = 'a52a621e-44a1-4e77-b744-720867d776d6'
APPLY = '--apply' in sys.argv
def call(method, path, body=None):
    req = urllib.request.Request(URL + path, method=method, headers={**H, 'Prefer': 'return=representation'}, data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req) as r: t = r.read(); return json.loads(t) if t else None
def fetch(t):
    rows, s = [], 0
    while True:
        with urllib.request.urlopen(urllib.request.Request(URL + f'{t}?select=*&order=id', headers={**H, 'Range': f'{s}-{s+999}'})) as r: b = json.load(r)
        rows += b; s += 1000
        if len(b) < 1000: return rows

def nz(s): return unicodedata.normalize('NFKC', s or '').lower().replace('釀', '醸').replace('é', 'e').replace('火入れ', '火入').replace('無濾過', '無ろ過')
def compact(s): return re.sub(r'[\s　・･·\-‐ー―〜~「」『』()（）\[\]【】"\'”“、,.!！]', '', nz(s))
def tokens(s): return frozenset(t for t in re.split(r'[\s　・･·、,]+', nz(s)) if t)
def brew(s): return re.sub(r'(株式会社|\(株\)|㈱|有限会社|合資会社|合名会社|酒造店|酒造場|酒造|醸造|本店|商店)', '', compact(s))
clean = lambda s: re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', s or '').replace('　', ' ')).strip()
def full_name(e):
    b, n = clean(e['brand']), clean(e['name'])
    return n if not b or compact(n).startswith(compact(b)) else f'{b} {n}'
num = lambda v: (lambda m: float(m.group()) if m else None)(re.search(r'-?\d+(\.\d+)?', str(v or '')))
TYPE = {'junmai': '純米', 'tokubetsu-junmai': '特別純米', 'junmai-ginjo': '純米吟醸', 'junmai-daiginjo': '純米大吟醸', 'honjozo': '本醸造', 'tokubetsu-honjozo': '特別本醸造', 'ginjo': '吟醸', 'daiginjo': '大吟醸', 'futsushu': '普通酒'}
HAND = {('作', '玄乃智'): '作 純米酒 玄乃智'}  # checked by hand: same sake, catalogue name carries the grade

P, E, W, A = fetch('sake_products'), fetch('sake_entries'), fetch('sake_breweries'), fetch('sake_areas')
area = {a['id']: a['name'] for a in A}
byB = collections.defaultdict(list)
for p in P: byB[brew(p['brewery_name'])].append(p)
byName = {compact(p['name']): p for p in P}
# Same-name breweries exist in several prefectures (高木酒造: 山形 and 高知) → the record's region decides.
breweries_named = collections.defaultdict(list)
for w in W: breweries_named[brew(w['name'])].append(w)
def find_brewery(e):
    ws = breweries_named.get(brew(e['brewery']), [])
    if len(ws) == 1: return ws[0]['id']
    same = [w for w in ws if area.get(w['area_id']) and area.get(w['area_id']) == (e['region'] or '')]
    return same[0]['id'] if len(same) == 1 else None

link, create, private = [], collections.defaultdict(list), []
for e in E:
    if e['user_id'] != USER or e['status'] == 'draft' or e['product_id']: continue
    full = full_name(e)
    # the record's brewery field can be off (e.g. 雪の茅舎 for 齋彌酒造店) → fall back to the brand prefix
    cands = byB.get(brew(e['brewery']), []) or [p for p in P if e['brand'] and compact(p['name']).startswith(compact(e['brand']))]
    hit = [p for p in cands if compact(p['name']) == compact(full)] or [p for p in cands if tokens(p['name']) == tokens(full)]
    hand = HAND.get((e['brand'], clean(e['name'])))
    if hand: hit = [byName[compact(hand)]]
    if len(hit) == 1: link.append((e, hit[0])); continue
    create[(tokens(full), brew(e['brewery']))].append(e)
# A private record only rides along when the same sake is also recorded publicly (its name is public already).
for k in list(create):
    if not any(x['is_public'] for x in create[k]): private += create.pop(k)

print(f'link to existing: {len(link)}')
for e, p in link: print('  ', full_name(e), '→', p['name'])
print('records sharing a new product:', [[full_name(x) + (' (private)' if not x['is_public'] else '') for x in v] for v in create.values() if len(v) > 1])
print(f'new products: {len(create)} (for {sum(len(v) for v in create.values())} records)')
for v in create.values(): print('  ', full_name(v[0]), '|', v[0]['brewery'], f'×{len(v)}' if len(v) > 1 else '', '' if find_brewery(v[0]) else '(no brewery match)')
print(f'private, left alone: {len(private)}')
for e in private: print('  ', full_name(e))
if not APPLY: sys.exit()

log = {'linked': [], 'created': []}
for e, p in link:
    call('PATCH', f"sake_entries?id=eq.{e['id']}", {'product_id': p['id']}); log['linked'].append(e['id'])
for v in create.values():
    e = next((x for x in v if x['is_public']), v[0])
    row = {'name': full_name(e), 'brewery_name': clean(e['brewery']) or None, 'region': e['region'] or None, 'type': TYPE.get(e['type']),
           'rice': clean(e['rice']) or None, 'yeast': clean(e['yeast']) or None, 'polishing': num(e['polishing']), 'alcohol': num(e['alcohol']),
           'smv': clean(e['smv']) or None, 'acidity': num(e['acidity']), 'brewery_id': find_brewery(e)}
    made = call('POST', 'sake_products', row)[0]
    log['created'].append(made['id'])
    for x in v:
        call('PATCH', f"sake_entries?id=eq.{x['id']}", {'product_id': made['id']}); log['linked'].append(x['id'])
json.dump(log, open(os.path.expanduser('~/kikiroku/backups/2026-10-13-types/link_log.json'), 'w'), indent=1)
E2 = fetch('sake_entries')
mine = [e for e in E2 if e['user_id'] == USER and e['status'] != 'draft']
print('linked now:', sum(1 for e in mine if e['product_id']), '/', len(mine), '| products:', len(fetch('sake_products')))
