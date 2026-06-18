#!/usr/bin/env node
// Correct known wrong readings in sake_brands (kuromoji can't handle archaic/poetic readings)
// Run: SUPABASE_SERVICE_ROLE_KEY=... node scripts/correct-readings.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://iqfgzxbwthdybokvafsi.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_KEY) { console.error('Set SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }

const db = createClient(SUPABASE_URL, SUPABASE_KEY)

// [name, furigana, romaji]
// Romaji: Hepburn, long-vowel compressed (ou→o, uu→u), no spaces unless proper noun phrase
const CORRECTIONS = [
  // ── Non-standard / poetic readings kuromoji cannot deduce ──
  ['而今',            'じこん',               'jikon'],           // 而=ジ is archaic
  ['新政',            'あらまさ',             'aramasa'],         // kuromoji → しんせい
  ['東一',            'あずまいち',           'azumaichi'],       // kuromoji → ひがしいち
  ['田酒',            'でんしゅ',             'denshu'],          // kuromoji → たざけ/たしゅ
  ['獺祭',            'だっさい',             'dassai'],
  ['産土',            'うぶすな',             'ubusuna'],         // very non-standard reading
  ['仙禽',            'せんきん',             'senkin'],
  ['射美',            'いび',                 'ibi'],             // 射=い is unusual
  ['飛露喜',          'ひろき',               'hiroki'],
  ['写楽',            'しゃらく',             'sharaku'],
  ['天吹',            'あまぶき',             'amabuki'],         // 吹=ぶき non-standard
  ['七田',            'しちだ',               'shichida'],
  ['農口',            'のぐち',               'noguchi'],
  ['光栄菊',          'こうえいきく',         'koeikiku'],
  ['〆張鶴',          'しめはりつる',         'shimeharitsuru'],
  ['花陽浴',          'はなあびる',           'hanaabiru'],       // kuromoji → はなようよく
  ['亀齢',            'きれい',               'kirei'],           // reads like 綺麗, poetic
  ['鳳凰美田',        'ほうおうびでん',       'hoobiden'],
  ['呉春',            'ごしゅん',             'goshun'],
  ['三芳菊',          'みよしきく',           'miyoshikiku'],
  ['風の森',          'かぜのもり',           'kazenomori'],
  ['十四代',          'じゅうよんだい',       'juyondai'],
  ['黒龍',            'こくりゅう',           'kokuryu'],
  ['磯自慢',          'いそじまん',           'isojiman'],
  ['久保田',          'くぼた',               'kubota'],
  ['八海山',          'はっかいさん',         'hakkaisan'],
  ['出羽桜',          'でわざくら',           'dewazakura'],
  ['鍋島',            'なべしま',             'nabeshima'],
  ['九平次',          'くへいじ',             'kuheiji'],
  ['醸し人九平次',    'かもしびとくへいじ',   'kamoshibitokuheiji'],
  ['南',              'みなみ',               'minami'],
  ['陸奥八仙',        'むつはっせん',         'mutsuhassen'],
  ['手取川',          'てどりがわ',           'tedorigawa'],
  ['常山',            'じょうざん',           'jozan'],
  ['鶴齢',            'かくれい',             'kakurei'],
  ['庭のうぐいす',    'にわのうぐいす',       'niwa no uguisu'],
  ['山の壽',          'やまのことぶき',       'yamanokotobuki'],
  ['雪中梅',          'せっちゅうばい',       'setchubai'],
  ['越乃寒梅',        'こしのかんばい',       'koshinokanbai'],
  ['寒菊',            'かんぎく',             'kangiku'],
  ['篠峯',            'しのみね',             'shinominе'],
  ['宗玄',            'そうげん',             'sogen'],
  ['五人娘',          'ごにんむすめ',         'goninmusume'],
  ['天覧山',          'てんらんざん',         'tenranzan'],
  ['両関',            'りょうぜき',           'ryozeki'],
  ['白鶴',            'はくつる',             'hakutsuru'],
  ['菊正宗',          'きくまさむね',         'kikumasamune'],
  ['賀茂鶴',          'かもつる',             'kamotsuru'],
  ['賀茂金秀',        'かもきんしゅう',       'kamokinshu'],
  ['雨後の月',        'うごのつき',           'ugonotsuki'],
  ['竹鶴',            'たけつる',             'taketsuru'],
  ['酔心',            'すいしん',             'suishin'],
  ['松の司',          'まつのつかさ',         'matsunotsukasa'],
  ['旭菊',            'あさひきく',           'asahikiku'],
  ['繁桝',            'しげます',             'shigemasu'],
  ['西の関',          'にしのせき',           'nishinoseki'],
  ['千代の光',        'ちよのひかり',         'chiyonohikari'],
  ['豊能梅',          'とよのうめ',           'toyonoume'],       // 高知県・高木酒造
  ['信州 亀齢',       'しんしゅうきれい',     'shinshukirei'],    // 長野県・岩波酒造
]

async function main() {
  let updated = 0
  const notFound = []

  for (const [name, furigana, romaji] of CORRECTIONS) {
    const { data, error } = await db
      .from('sake_brands')
      .update({ furigana, romaji })
      .eq('name', name)
      .select('id,name')

    if (error) {
      console.error(`✗ ${name}: ${error.message}`)
    } else if (!data?.length) {
      notFound.push(name)
    } else {
      console.log(`✓  ${name.padEnd(14)} → ${furigana}  /  ${romaji}`)
      updated++
    }
  }

  console.log(`\n✅  Updated ${updated} / ${CORRECTIONS.length}`)
  if (notFound.length) {
    console.log(`⚠️   Not found in DB (${notFound.length}): ${notFound.join('、')}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
