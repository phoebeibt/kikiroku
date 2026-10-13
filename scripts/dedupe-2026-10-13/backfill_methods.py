"""Add スタイル・製法 tags that the record's own sake name already states (2026-10-13, user-approved).
Only adds, never removes. 「雫」 alone is not read as 袋吊り (it is often part of a name, e.g. 西都の雫).
Usage: python3 backfill_methods.py [--apply]"""
import json, os, re, sys, unicodedata, urllib.request
env = dict(l.strip().split('=', 1) for l in open(os.path.expanduser('~/kikiroku/.env.local')) if '=' in l)
URL = env['VITE_SUPABASE_URL'].rstrip('/') + '/rest/v1/'; KEY = env['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'}
USER = 'a52a621e-44a1-4e77-b744-720867d776d6'
KW = [('生酛|生もと|きもと|育酛', 'kimoto'), ('山廃', 'yamahai'), ('菩提酛', 'bodaimoto'), ('貴醸|貴釀', 'kijoshu'), ('木桶', 'kioke'), ('柱焼酎', 'hashira-shochu'), ('白麹', 'shirokoji'),
      ('袋吊|雫取|しずく取|斗瓶', 'fukurozuri'), ('槽搾|槽しぼり', 'funeshibori'), ('あらばしり', 'arabashiri'), ('中取|中汲', 'nakadori'),
      ('生原酒|生酒|無濾過生|無ろ過生|本生|(?<![a-z])生(?![酛詰貯])', 'namazake'), ('生詰', 'namazume'), ('生貯蔵', 'namachozo'), ('一回火入|一火|1回火入', 'ikkai-hiire'), ('瓶燗|瓶火入', 'binkan'),
      ('原酒', 'genshu'), ('無濾過|無ろ過', 'muroka'), ('うすにごり', 'usunigori'), ('おりがらみ|おり酒', 'origarami'), ('活性', 'kassei'), ('(?<!うす)にごり|濁', 'nigori'),
      ('発泡|スパークリング|スバークリング|sparkling', 'sparkling'), ('熟成|古酒', 'koshu'), ('低アル', 'low-alcohol')]
E = json.load(urllib.request.urlopen(urllib.request.Request(URL + f'sake_entries?select=id,brand,name,method_tags&user_id=eq.{USER}', headers=H)))
plan = []
for e in E:
    n = unicodedata.normalize('NFKC', f"{e['brand'] or ''} {e['name'] or ''}")
    have = e['method_tags'] or []
    new = [t for k, t in KW if re.search(k, n, re.I) and t not in have]
    if new: plan.append((e, have + new, new))
print(len(plan), 'records')
for e, _, new in plan: print(' ', e['brand'], e['name'], '+', new)
if '--apply' not in sys.argv: sys.exit()
json.dump([{'id': e['id'], 'method_tags': e['method_tags']} for e, _, _ in plan], open(os.path.expanduser('~/kikiroku/backups/2026-10-13-types/method_tags_before_backfill.json'), 'w'), ensure_ascii=False)
for e, tags, _ in plan:
    urllib.request.urlopen(urllib.request.Request(URL + f"sake_entries?id=eq.{e['id']}", method='PATCH', headers=H, data=json.dumps({'method_tags': tags}).encode())).read()
print('applied', len(plan))
