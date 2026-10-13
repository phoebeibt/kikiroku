"""Give sake_products without a brewery_id their brewery (2026-10-13, user-approved).
Names differ only by variant kanji / company form (枡田↔桝田, 中沢↔中澤, 浜川↔濵川, 合名/合資…),
checked against each product's brand and prefecture. Joint brews (DATE SEVEN, NEXT FIVE) stay unlinked.
Also merges brewery 1434 山和酒造 into 1020 山和酒造店 (same 宮城 brewery; only 4 awards point at it).
Usage: python3 link_breweries.py [--apply]"""
import json, os, sys, urllib.request, urllib.parse
env = dict(l.strip().split('=', 1) for l in open(os.path.expanduser('~/kikiroku/.env.local')) if '=' in l)
URL = env['VITE_SUPABASE_URL'].rstrip('/') + '/rest/v1/'; KEY = env['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json', 'Prefer': 'return=representation'}
def call(method, path, body=None):
    req = urllib.request.Request(URL + urllib.parse.quote(path, safe='/?=&(),.*'), method=method, headers=H, data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req) as r: t = r.read(); return json.loads(t) if t else None
MAP = {  # products.brewery_name → sake_breweries.id
    '枡田酒造店': 325, '中沢酒造': 942, '浜川商店': 727, '三浦酒造店': 922, '井上合名': 736, '山崎合資': 453,
    '西條鶴酒造': 1146, '豊国酒造': 136, '司牡丹酒造': 719, '高木酒造株式会社': 968,
}
EXTRA = [('DATÉ SEVEN season 2 EPISODE V 山和Style', 1020)]   # by product name
FIX_REGION = {'豊能梅 空と海': '高知県'}                          # 豊能梅 is 高木酒造 of 高知; the record said 愛知
nob = call('GET', 'sake_products?brewery_id=is.null&select=id,name,brewery_name,region')
plan = [(p, MAP[p['brewery_name']]) for p in nob if p['brewery_name'] in MAP] + [(p, b) for p in nob for n, b in EXTRA if p['name'] == n]
print('without brewery:', len(nob), '| will link:', len(plan), '| stay unlinked:', [p['name'] for p in nob if p['id'] not in {x['id'] for x, _ in plan}])
merge_awards = call('GET', 'sake_awards?brewery_id=eq.1434&select=id')
print('merge 1434 → 1020: awards', len(merge_awards), '| brands', len(call('GET', 'sake_brands?brewery_id=eq.1434&select=id')), '| products', len(call('GET', 'sake_products?brewery_id=eq.1434&select=id')))
if '--apply' not in sys.argv: sys.exit()
for p, b in plan:
    body = {'brewery_id': b}
    if p['name'] in FIX_REGION: body['region'] = FIX_REGION[p['name']]
    call('PATCH', f"sake_products?id=eq.{p['id']}", body)
for t in ['sake_awards', 'sake_brands', 'sake_products']: call('PATCH', f'{t}?brewery_id=eq.1434', {'brewery_id': 1020})
call('DELETE', 'sake_breweries?id=eq.1434')
print('still without brewery:', len(call('GET', 'sake_products?brewery_id=is.null&select=id')), '| rows pointing at 1434:', sum(len(call('GET', f'{t}?brewery_id=eq.1434&select=id')) for t in ['sake_awards', 'sake_brands', 'sake_products']), '| 1434 exists:', bool(call('GET', 'sake_breweries?id=eq.1434&select=id')))
