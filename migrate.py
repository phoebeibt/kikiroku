#!/usr/bin/env python3
import requests, json, html, re, sys

WP_API  = "https://www.swordandcurse.com/wp-json/wp/v2"
CAT     = 28
SB_URL  = "https://iqfgzxbwthdybokvafsi.supabase.co"

SERVICE_KEY = input("Supabase service_role key: ").strip()
USER_ID     = input("Your Supabase user UUID: ").strip()

print("\nFetching WordPress posts...")
r = requests.get(
    f"{WP_API}/posts?categories={CAT}&per_page=100&_embed=true&orderby=date&order=desc",
    timeout=30
)
r.raise_for_status()
posts = r.json()
print(f"Found {len(posts)} posts")

def parse_meta(p):
    try:
        s = re.sub(r'<[^>]*>', '', p.get('excerpt', {}).get('rendered', ''))
        s = html.unescape(s).strip()
        s = re.sub(u'[“”„‟″]', '"', s)
        s = re.sub(u'[‘’‚‛′]', "'", s)
        return json.loads(s)
    except Exception as e:
        print(f'    [parse error] {e}')
        return {}

entries = []
for p in posts:
    m = parse_meta(p)
    photo_url = None
    try:
        photo_url = p['_embedded']['wp:featuredmedia'][0]['source_url']
    except:
        pass
    body = re.sub(r'<[^>]*>', '', p.get('content', {}).get('rendered', '')).strip() or None

    rating = m.get('rating')
    if rating is not None:
        try:
            rating = float(rating)
            if not (1 <= rating <= 5):
                rating = None
        except:
            rating = None

    tags = m.get('tags')
    if not isinstance(tags, list):
        tags = None

    entry = {
        'user_id':        USER_ID,
        'name':           html.unescape(p['title']['rendered']),
        'brewery':        m.get('brewery') or None,
        'region':         m.get('region') or None,
        'type':           m.get('type') or None,
        'rating':         rating,
        'aroma':          None,
        'taste':          None,
        'notes':          body,
        'photo_url':      photo_url,
        'photo_url2':     m.get('img2') or None,
        'alcohol':        m.get('alcohol') or None,
        'rice':           m.get('rice') or None,
        'polishing':      m.get('polishing') or None,
        'smv':            m.get('smv') or None,
        'acidity':        m.get('acidity') or None,
        'yeast':          m.get('yeast') or None,
        'bottling_date':  m.get('bottling_date') or None,
        'drinking_date':  m.get('drinking_date') or None,
        'tags':           tags,
        'tasted_at':      p['date'][:10],
        'is_public':      True,
    }
    entries.append(entry)
    print(f"  · {entry['name']} ({entry['tasted_at']})")

print(f"\nInserting {len(entries)} entries into Supabase...")
headers = {
    'apikey':        SERVICE_KEY,
    'Authorization': f'Bearer {SERVICE_KEY}',
    'Content-Type':  'application/json',
    'Prefer':        'return=minimal',
}
res = requests.post(
    f"{SB_URL}/rest/v1/sake_entries",
    headers=headers,
    json=entries,
    timeout=30
)
if res.status_code in (200, 201):
    print(f"\n✓ 迁移完成！{len(entries)} 条记录已导入。")
else:
    print(f"\n✗ 出错了 ({res.status_code}): {res.text}")
    sys.exit(1)
