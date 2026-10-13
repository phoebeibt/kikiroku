"""Set sake_products.type from the grade written in the sake name (2026-10-13, user-approved).
Plan: type_fix_plan.json (903 rows). Usage: python3 fix_types.py [--apply]"""
import json, os, sys, collections, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
env = dict(l.strip().split('=', 1) for l in open(os.path.expanduser('~/kikiroku/.env.local')) if '=' in l)
URL = env['VITE_SUPABASE_URL'].rstrip('/') + '/rest/v1/'; KEY = env['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'}
def fetch():
    rows, start = [], 0
    while True:
        with urllib.request.urlopen(urllib.request.Request(URL + 'sake_products?select=id,name,type&order=id', headers={**H, 'Range': f'{start}-{start+999}'})) as r: b = json.load(r)
        rows += b
        if len(b) < 1000: return rows
        start += 1000
plan = json.load(open(os.path.join(os.path.dirname(__file__), 'type_fix_plan.json')))
before = {p['id']: p for p in fetch()}
todo = [r for r in plan if r['id'] in before and before[r['id']]['type'] == r['from']]
print(f'plan {len(plan)}, still applicable {len(todo)}')
if '--apply' not in sys.argv: sys.exit()
out = os.path.expanduser('~/kikiroku/backups/2026-10-13-types/'); os.makedirs(out, exist_ok=True)
json.dump(list(before.values()), open(out + 'sake_products_id_name_type.json', 'w'), ensure_ascii=False)
by = collections.defaultdict(list)
for r in todo: by[r['to']].append(r['id'])
for t, ids in by.items():
    for i in range(0, len(ids), 80):
        chunk = ids[i:i+80]
        req = urllib.request.Request(URL + 'sake_products?id=in.(' + ','.join(chunk) + ')', method='PATCH', headers={**H, 'Prefer': 'return=minimal'}, data=json.dumps({'type': t}).encode())
        urllib.request.urlopen(req).read()
after = {p['id']: p for p in fetch()}
changed = [i for i in after if after[i]['type'] != before[i]['type']]
want = {r['id']: r['to'] for r in todo}
print('rows changed:', len(changed), '| expected', len(todo), '| unexpected changes:', sum(1 for i in changed if i not in want), '| wrong value:', sum(1 for i in want if after[i]['type'] != want[i]))
print('type counts now:', collections.Counter(p['type'] for p in after.values()).most_common())
