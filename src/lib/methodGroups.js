// スタイル・製法 groups, in brewing order. Tag ids live in sake_tags (category 'method');
// an id missing here falls into the last group so a new DB tag still shows up.
export const METHOD_GROUPS = [
  { key: 'moto',    ja: '酒母（酛）',         zh: '酒母（酛）',       en: 'Starter',          ids: ['kimoto', 'yamahai', 'bodaimoto', 'kobo-mutenka'] },
  { key: 'shikomi', ja: '仕込み',             zh: '釀造',             en: 'Brewing',          ids: ['kijoshu', 'kioke', 'hashira-shochu', 'shirokoji', 'yondan', 'low-alcohol'] },
  { key: 'shibori', ja: '搾り・部位',         zh: '壓榨・部位',       en: 'Pressing',         ids: ['fukurozuri', 'funeshibori', 'enshin', 'arabashiri', 'nakadori', 'seme'] },
  { key: 'hiire',   ja: '火入れ・加水・ろ過', zh: '火入・加水・過濾', en: 'Finishing',        ids: ['namazake', 'namazume', 'namachozo', 'ikkai-hiire', 'binkan', 'genshu', 'muroka'] },
  { key: 'mitame',  ja: 'にごり・発泡',       zh: '濁・氣泡',         en: 'Cloudy & sparkling', ids: ['nigori', 'usunigori', 'origarami', 'kassei', 'sparkling'] },
  { key: 'jukusei', ja: '熟成・その他',       zh: '熟成・其他',       en: 'Ageing & other',   ids: ['koshu', 'taruzake', 'blend'] },
]
