import Japan from '@react-map/japan'

// Japanese prefecture name → library stateCode
export const JA_TO_CODE = {
  '北海道': 'Hokkaido\x8d',
  '青森': 'Aomori', '青森県': 'Aomori',
  '岩手': 'Iwate',   '岩手県': 'Iwate',
  '宮城': 'Miyagi',  '宮城県': 'Miyagi',
  '秋田': 'Akita',   '秋田県': 'Akita',
  '山形': 'Yamagata','山形県': 'Yamagata',
  '福島': 'Fukushima','福島県': 'Fukushima',
  '茨城': 'Ibaraki', '茨城県': 'Ibaraki',
  '栃木': 'Tochigi', '栃木県': 'Tochigi',
  '群馬': 'Gunma',   '群馬県': 'Gunma',
  '埼玉': 'Saitama', '埼玉県': 'Saitama',
  '千葉': 'Chiba',   '千葉県': 'Chiba',
  '東京': 'Tokyo',   '東京都': 'Tokyo',
  '神奈川': 'Kanagawa','神奈川県': 'Kanagawa',
  '新潟': 'Niigata', '新潟県': 'Niigata',
  '富山': 'Toyama',  '富山県': 'Toyama',
  '石川': 'Ishikawa','石川県': 'Ishikawa',
  '福井': 'Fukui',   '福井県': 'Fukui',
  '山梨': 'Yamanashi','山梨県': 'Yamanashi',
  '長野': 'Nagano',  '長野県': 'Nagano',
  '岐阜': 'Gifu',    '岐阜県': 'Gifu',
  '静岡': 'Shizuoka','静岡県': 'Shizuoka',
  '愛知': 'Aichi',   '愛知県': 'Aichi',
  '三重': 'Mie',     '三重県': 'Mie',
  '滋賀': 'Shiga',   '滋賀県': 'Shiga',
  '京都': 'Kyoto',   '京都府': 'Kyoto',
  '大阪': 'Osaka',   '大阪府': 'Osaka',
  '兵庫': 'Hyogo',   '兵庫県': 'Hyogo',
  '奈良': 'Nara',    '奈良県': 'Nara',
  '和歌山': 'Wakayama','和歌山県': 'Wakayama',
  '鳥取': 'Tottori', '鳥取県': 'Tottori',
  '島根': 'Shimane', '島根県': 'Shimane',
  '岡山': 'Okayama', '岡山県': 'Okayama',
  '広島': 'Hiroshima','広島県': 'Hiroshima',
  '山口': 'Yamaguchi','山口県': 'Yamaguchi',
  '徳島': 'Tokushima','徳島県': 'Tokushima',
  '香川': 'Kagawa',  '香川県': 'Kagawa',
  '愛媛': 'Ehime',   '愛媛県': 'Ehime',
  '高知': 'Kochi',   '高知県': 'Kochi',
  '福岡': 'Fukuoka', '福岡県': 'Fukuoka',
  '佐賀': 'Saga',    '佐賀県': 'Saga',
  '長崎': 'Nagasaki','長崎県': 'Nagasaki',
  '熊本': 'Kumamoto','熊本県': 'Kumamoto',
  '大分': 'Oita',    '大分県': 'Oita',
  '宮崎': 'Miyazaki','宮崎県': 'Miyazaki',
  '鹿児島': 'Kagoshima','鹿児島県': 'Kagoshima',
  '沖縄': 'Okinawa', '沖縄県': 'Okinawa',
}

export default function JapanMap({ regionCounts = {}, selected, onSelect }) {
  const maxCount = Math.max(...Object.values(regionCounts), 1)

  const cityColors = {}
  for (const [ja, count] of Object.entries(regionCounts)) {
    const code = JA_TO_CODE[ja]
    if (!code || !count) continue
    const intensity = 0.25 + (count / maxCount) * 0.75
    const r = Math.round(181 * intensity + 30 * (1 - intensity))
    const g = Math.round(69  * intensity + 20 * (1 - intensity))
    const b = Math.round(27  * intensity + 15 * (1 - intensity))
    cityColors[code] = `rgb(${r},${g},${b})`
  }

  // Full map Y: 0–515. Main islands (Hokkaido–Kagoshima) Y: 0–378 = 73.3%.
  // At 260px wide the SVG renders ~307px tall. Main islands = 225px.
  // Scale 1.25 → main islands fill 281px; clip container at that height to hide Okinawa.
  // translateX(-6%) shifts content left so Hokkaido (top-right) stays in frame.
  return (
    <div style={{ width: 260, margin: '0 auto', overflow: 'hidden', height: 281 }}>
      <div style={{ transform: 'scale(1.25) translateX(-6%)', transformOrigin: 'top center' }}>
        <Japan
          type="select-single"
          size="100%"
          mapColor="var(--border)"
          strokeColor="var(--surface-card)"
          strokeWidth={0.8}
          cityColors={cityColors}
          hoverColor="rgba(181,69,27,.18)"
          selectColor="rgba(181,69,27,.35)"
          onSelect={code => onSelect?.(code === selected ? null : code)}
        />
      </div>
    </div>
  )
}
