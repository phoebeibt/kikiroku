#!/usr/bin/env node
// Link IWC 2026 sake_awards to Japanese brewery names.
// Appends " | 日本語名" to brewery_name so EntryDetail's ilike lookup finds them.
// Usage: node scripts/link-iwc-to-japanese.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const db = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Confirmed mappings: IWC English brewery name fragment → Japanese brewery + brand keywords
// Key = unique substring of IWC brewery_name, value = array of Japanese search terms to append
const BREWERY_MAP = [
  // brewery_name contains  →  append Japanese keywords
  { match: 'NANBU BIJIN',           ja: '南部美人' },
  { match: 'Hagino Shuzo',          ja: '萩野酒造 萩の鶴 はぎのつる' },
  { match: 'Sanyohai Shuzo',        ja: '山陽盃酒造 播州一献 ばんしゅういっけん' },
  { match: 'TAKAGI SHUZO',          ja: '高木酒造 豊能梅 とよのうめ' },  // 高知 Takagi (not 山形)
  { match: 'Hatsumomidi',           ja: 'はつもみぢ 原田 はらだ' },
  { match: 'Nambu Sake Brewery',    ja: '南部酒造 花垣 はながき' },
  { match: 'IINUMAHONKE',           ja: '飯沼本家 甲子 きのえね' },
  { match: 'ECHIGO TSURUKAME',      ja: '越後鶴亀 えちごつるかめ' },
  { match: 'Echigozakura Shuzo',    ja: '越後桜酒造' },
  { match: 'Niizawa Sake Brewery',  ja: '新澤醸造店 伯楽星 はくらくせい' },
  { match: 'Katsuyama Shuzo',       ja: '勝山酒造' },
  { match: 'Dewazakura Sake Brewery', ja: '出羽桜酒造 でわざくら' },
  { match: 'Daishichi Sake Brewery', ja: '大七酒造' },
  { match: 'Asabiraki',             ja: 'あさ開 南部酒造' },
  { match: 'Hachinohe Shuzo',       ja: '八戸酒造' },
  { match: 'Aihara Shuzo',          ja: '相原酒造 雨後の月 うごのつき' },
  { match: 'Miyazaki Honten',       ja: '宮崎本店 宮の雪' },
  { match: 'Shimizu Sizaburo',      ja: '清水清三郎商店 作 ざく' },
  { match: 'Hakkaisan',             ja: '八海醸造 八海山 はっかいさん' },
  { match: 'Konishi Brewing',       ja: '小西酒造 白雪 しらゆき' },
  { match: 'Watanabe Shuzoten',     ja: '渡辺酒造店 蓬莱 ほうらい' },
  { match: 'Fukuchiyo Shuzo',       ja: '富久千代酒造 鍋島 なべしま' },
  { match: 'Heiwa Shuzou',          ja: '平和酒造 Kid きっど' },
  { match: 'Suigei Brewing',        ja: '酔鯨酒造 酔鯨 すいげい' },
  { match: 'Tosa Brewing',          ja: '高知酒造 桂月 けいげつ' },
  { match: 'Yaoshin Shuzo',         ja: '八百新酒造 雁木 がんぎ' },
  { match: 'Sekinoichi Syuzo',      ja: '世嬉の一酒造' },
  { match: 'Taiwagura',             ja: '大和蔵酒造 雪の松島 ゆきのまつしま' },
  { match: 'Matsuuraichi',          ja: '松浦一酒造' },
  { match: 'Sakuramasamune',        ja: '櫻正宗 さくらまさむね' },
  { match: 'Raifuku Sake',          ja: '来福酒造 来福 らいふく' },
  { match: 'Ishizuchi Shuzo',       ja: '石鎚酒造 石鎚 いしづち' },
  { match: 'Yamanashi Meijo',       ja: '山梨銘醸 七賢 しちけん' },
  { match: 'NAGAI SAKE',            ja: '永井酒造 水芭蕉 みずばしょう' },
  { match: 'S. Imanishi',           ja: '今西酒造 春鹿 はるしか' },
  { match: 'Niigata Meijo',         ja: '新潟名醸 越の寒中梅' },
  { match: 'Tatenokawa',            ja: '楯の川酒造 楯野川 たてのかわ' },

  // Extended mappings
  { match: 'Dassai',               ja: '旭酒造 獺祭 だっさい' },
  { match: 'Asahi Shuzo',          ja: '旭酒造' },
  { match: 'Aramasa',              ja: '新政酒造 新政 あらまさ' },
  { match: 'Jikon',                ja: '木屋正酒造 而今 じこん' },
  { match: 'Kiyasho',              ja: '木屋正酒造' },
  { match: 'Juyondai',             ja: '高木酒造 十四代 じゅうよんだい' },
  { match: 'Takagi Shuzo',         ja: '高木酒造 十四代 じゅうよんだい' },
  { match: 'Senkin',               ja: 'せんきん 仙禽 せんきん' },
  { match: 'Senboku',              ja: 'せんきん' },
  { match: 'Akabu',                ja: '赤武酒造 赤武 あかぶ' },
  { match: 'Kaze no Mori',         ja: '油長酒造 風の森 かぜのもり' },
  { match: 'Yucho Shuzo',          ja: '油長酒造' },
  { match: 'Narutotai',            ja: '本家松浦酒造場 鳴門鯛 なるとたい' },
  { match: 'Matsuura Sake',        ja: '本家松浦酒造場' },
  { match: 'Michisakari',          ja: '宮崎本店 道三 みちさかり' },
  { match: 'Masumi',               ja: '宮坂醸造 真澄 ますみ' },
  { match: 'Miyasaka',             ja: '宮坂醸造' },
  { match: 'Kuheiji',              ja: '萬乗醸造 醸し人九平次 くへいじ' },
  { match: 'Banjyo',               ja: '萬乗醸造' },
  { match: 'Jokigen',              ja: '米鶴酒造 上喜元 じょうきげん' },
  { match: 'Yonetsuru',            ja: '米鶴酒造' },
  { match: 'Urakasumi',            ja: '株式会社 佐浦 浦霞 うらかすみ' },
  { match: 'Saura',                ja: '株式会社 佐浦 浦霞' },
  { match: 'Jizake Sakagura',      ja: '地酒蔵' },
  { match: 'Kenbishi',             ja: '剣菱酒造 剣菱 けんびし' },
  { match: 'Hakutsuru',            ja: '白鶴酒造 白鶴 はくつる' },
  { match: 'Ozeki',                ja: '大関酒造 大関 おおぜき' },
  { match: 'Gekkeikan',            ja: '月桂冠 つきのかつら' },
  { match: 'Tamanohikari',         ja: '玉乃光酒造 玉乃光 たまのひかり' },
  { match: 'Kyoto Brewing',        ja: '京都醸造' },
  { match: 'Choryo',               ja: '長龍酒造 長龍 ちょうりゅう' },
  { match: 'Nishino Shuzo',        ja: '西野金陵 きんりょう' },
  { match: 'Kinryo',               ja: '西野金陵 金陵 きんりょう' },
  { match: 'Imayo Tsukasa',        ja: '今代司酒造 今代司 いまよつかさ' },
  { match: 'Hidakami',             ja: '平孝酒造 日高見 ひだかみ' },
  { match: 'Heiko Shuzo',          ja: '平孝酒造' },
  { match: 'Kozaemon',             ja: '中島醸造 小左衛門 こざえもん' },
  { match: 'Nakashima Jozo',       ja: '中島醸造' },
  { match: 'Sensuke',              ja: '泉酒造 仙介 せんすけ' },
  { match: 'Izumi Shuzo',          ja: '泉酒造' },
  { match: 'Hanaabi',              ja: '花の香酒造 産土 にのじょう' },
  { match: 'Hananoka Shuzo',       ja: '花の香酒造' },
  { match: 'Gassan',               ja: '月山酒造 月山 がっさん' },
  { match: 'Gassan Shuzo',         ja: '月山酒造' },
  { match: 'Shimeharitsuru',       ja: '宮尾酒造 〆張鶴 しめはりつる' },
  { match: 'Miyao Shuzo',          ja: '宮尾酒造' },
  { match: 'Noto',                 ja: '能登酒造' },
  { match: 'Soukuu',               ja: '宗玄酒造 宗玄 そうくう' },
  { match: 'Sogen Shuzo',          ja: '宗玄酒造' },
  { match: 'Yamagata Masamune',    ja: '東北銘醸 山形正宗 やまがたまさむね' },
  { match: 'Tohoku Meijo',         ja: '東北銘醸' },
  { match: 'Banshu Ikkon',         ja: '山陽盃酒造 播州一献' },
  { match: 'Gozenshu',             ja: '辻本店 御前酒 ごぜんしゅ' },
  { match: 'Tsujimototen',         ja: '辻本店' },
  { match: 'Tsuyama',              ja: '辻本店' },
  { match: 'Hanahato',             ja: '相原酒造 花鳩 はなはと' },
  { match: 'Fukuju',               ja: '神戸酒心館 福寿 ふくじゅ' },
  { match: 'Kobe Shushinkan',      ja: '神戸酒心館' },
  { match: 'Sawanoi',              ja: '小澤酒造 澤乃井 さわのい' },
  { match: 'Ozawa Shuzo',          ja: '小澤酒造' },
  { match: 'Shochikubai Shirakabegura', ja: '宝酒造 松竹梅 白壁蔵' },
  { match: 'Takara Shuzo',         ja: '宝酒造' },
]

async function main() {
  console.log('🔗  Linking IWC awards (all years) to Japanese brewery names\n')

  let totalUpdated = 0

  for (const { match, ja } of BREWERY_MAP) {
    // Find all rows where brewery_name contains the match (but doesn't already have Japanese appended)
    // Paginate since sake_awards can be large
    let allRows = []
    for (let from = 0; ; from += 1000) {
      const { data: rows, error: fetchErr } = await db
        .from('sake_awards')
        .select('id, brewery_name')
        .ilike('brewery_name', `%${match}%`)
        .range(from, from + 999)
      if (fetchErr) { console.warn(`  ⚠ fetch ${match}: ${fetchErr.message}`); break }
      if (!rows || rows.length === 0) break
      allRows.push(...rows)
      if (rows.length < 1000) break
    }
    const rows = allRows

    if (!rows || rows.length === 0) { console.log(`  (no rows for: ${match})`); continue }

    // Only update rows that don't already have Japanese text
    const toUpdate = rows.filter(r => !r.brewery_name.includes(ja.split(' ')[0]))
    if (toUpdate.length === 0) { console.log(`  ✓ ${match} — already linked (${rows.length} rows)`); continue }

    for (const r of toUpdate) {
      const { error: upErr } = await db.from('sake_awards')
        .update({ brewery_name: `${r.brewery_name} | ${ja}` })
        .eq('id', r.id)
      if (upErr) { console.warn(`  ⚠ update ${r.id}: ${upErr.message}`) }
      else totalUpdated++
    }

    console.log(`  ✓ ${match} → +「${ja}」 (${toUpdate.length} rows updated)`)
  }

  console.log(`\nDone. Updated ${totalUpdated} records total.`)
  console.log('\nVerification: checking 南部美人 now matches...')
  const { data: check } = await db.from('sake_awards')
    .select('year, brand_name, brewery_name, is_gold')
    .ilike('brewery_name', '%南部美人%')
    .limit(5)
  if (check?.length > 0) {
    check.forEach(r => console.log(`  ${r.is_gold ? '★' : '○'} ${r.year} ${r.brand_name}`))
  } else {
    console.log('  (no results — check mapping)')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
