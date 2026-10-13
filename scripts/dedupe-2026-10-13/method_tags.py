"""スタイル・製法 taxonomy (2026-10-13, user-requested). Grounded on how often each word appears in the
4418 catalogue names. ja = SSI-style term with reading; zh/en = the same term (sake loanwords in English).
Seasonal words (しぼりたて, ひやおろし, 新酒) stay in 整理 (flavor) tags. Usage: python3 method_tags.py [--apply]"""
import json, os, sys, urllib.request
env = dict(l.strip().split('=', 1) for l in open(os.path.expanduser('~/kikiroku/.env.local')) if '=' in l)
URL = env['VITE_SUPABASE_URL'].rstrip('/') + '/rest/v1/'; KEY = env['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'}
# (id, ja, zh, en) — sort_order follows this list; the first six are the ones shown before もっと見る.
TAGS = [
    ('namazake', '生酒（なまざけ）', '生酒', 'Nama'),
    ('genshu', '原酒（げんしゅ）', '原酒', 'Genshu'),
    ('muroka', '無濾過（むろか）', '無過濾', 'Muroka'),
    ('nigori', 'にごり', '濁酒', 'Nigori'),
    ('sparkling', 'スパークリング', '氣泡', 'Sparkling'),
    ('yamahai', '山廃（やまはい）', '山廃', 'Yamahai'),
    ('kimoto', '生酛（きもと）', '生酛', 'Kimoto'),
    ('bodaimoto', '菩提酛（ぼだいもと）', '菩提酛', 'Bodaimoto'),
    ('kobo-mutenka', '酵母無添加（こうぼむてんか）', '無添加酵母', 'No added yeast'),
    ('kijoshu', '貴醸酒（きじょうしゅ）', '貴釀酒', 'Kijoshu'),
    ('kioke', '木桶仕込み（きおけじこみ）', '木桶釀造', 'Kioke'),
    ('hashira-shochu', '柱焼酎仕込み（はしらしょうちゅうじこみ）', '柱燒酎釀造', 'Hashira shochu'),
    ('shirokoji', '白麹仕込み（しろこうじじこみ）', '白麴釀造', 'White koji'),
    ('yondan', '四段仕込み（よんだんじこみ）', '四段釀造', 'Yondan'),
    ('low-alcohol', '低アルコール', '低酒精', 'Low alcohol'),
    ('fukurozuri', '袋吊り（ふくろづり）', '袋吊', 'Fukurozuri'),
    ('funeshibori', '槽搾り（ふなしぼり）', '槽搾', 'Fune-shibori'),
    ('enshin', '遠心分離（えんしんぶんり）', '離心分離', 'Centrifuged'),
    ('arabashiri', 'あらばしり', '荒走', 'Arabashiri'),
    ('nakadori', '中取り（なかどり）', '中取', 'Nakadori'),
    ('seme', '責め（せめ）', '責', 'Seme'),
    ('namazume', '生詰め（なまづめ）', '生詰', 'Namazume'),
    ('namachozo', '生貯蔵（なまちょぞう）', '生貯藏', 'Nama-chozo'),
    ('ikkai-hiire', '一回火入れ（いっかいひいれ）', '一次火入', 'Ikkai-hiire'),
    ('binkan', '瓶燗火入れ（びんかんひいれ）', '瓶燗火入', 'Bin-kan'),
    ('usunigori', 'うすにごり', '薄濁', 'Usu-nigori'),
    ('origarami', 'おりがらみ', '帶渣', 'Origarami'),
    ('kassei', '活性にごり（かっせいにごり）', '活性濁酒', 'Kassei nigori'),
    ('koshu', '古酒（こしゅ）', '古酒', 'Koshu'),
    ('taruzake', '樽酒（たるざけ）', '樽酒', 'Taruzake'),
    ('blend', 'ブレンド', '混釀', 'Blend'),
]
cur = {t['id']: t for t in json.load(urllib.request.urlopen(urllib.request.Request(URL + 'sake_tags?category=eq.method&select=*', headers=H)))}
plan = []
for i, (tid, ja, zh, en) in enumerate(TAGS):
    row = {'id': tid, 'category': 'method', 'ja': ja, 'zh': zh, 'en': en, 'sort_order': i, 'is_active': True}
    old = cur.get(tid)
    if not old: plan.append(('add', row))
    elif any(old[k] != row[k] for k in ('ja', 'zh', 'en', 'sort_order')): plan.append(('update', row, {k: old[k] for k in ('ja', 'zh', 'en', 'sort_order')}))
print(f"current {len(cur)}, target {len(TAGS)}")
for p in plan: print(p[0], p[1]['id'], p[1]['ja'], '/', p[1]['zh'], '/', p[1]['en'], '' if p[0] == 'add' else f"(was {p[2]['ja']} / {p[2]['zh']} #{p[2]['sort_order']})")
if '--apply' not in sys.argv: sys.exit()
json.dump(list(cur.values()), open(os.path.expanduser('~/kikiroku/backups/2026-10-13-types/sake_tags_method_before.json'), 'w'), ensure_ascii=False)
for p in plan:
    if p[0] == 'add':
        urllib.request.urlopen(urllib.request.Request(URL + 'sake_tags', method='POST', headers=H, data=json.dumps(p[1]).encode())).read()
    else:
        body = {k: p[1][k] for k in ('ja', 'zh', 'en', 'sort_order')}
        urllib.request.urlopen(urllib.request.Request(URL + f"sake_tags?category=eq.method&id=eq.{p[1]['id']}", method='PATCH', headers=H, data=json.dumps(body).encode())).read()
print('method tags now:', len(json.load(urllib.request.urlopen(urllib.request.Request(URL + 'sake_tags?category=eq.method&select=id', headers=H)))))
