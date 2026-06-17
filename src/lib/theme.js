const KEY = 'kikiroku-theme'
export const THEMES = [
  {
    id: 'aizome',
    ja: '藍硝子',
    zh: '藍硝子',
    en: 'Aizome (Dark)',
    preview: ['#060e18', '#B5451B', 'rgba(180,210,245,.6)'],
  },
  {
    id: 'fukahi',
    ja: '深緋',
    zh: '深緋',
    en: 'Fukahi (Light)',
    preview: ['#F4F0E8', '#7C3A28', '#8C7E74'],
  },
  {
    id: 'suminagashi',
    ja: '墨流し',
    zh: '墨流し',
    en: 'Suminagashi (Dark)',
    preview: ['#1C1C1E', '#C0392B', '#C9A56E'],
  },
]

export function getTheme() {
  return localStorage.getItem(KEY) || 'aizome'
}

export function applyTheme(id) {
  document.documentElement.dataset.theme = id
  localStorage.setItem(KEY, id)
  window.dispatchEvent(new Event('kikiroku-theme'))
}
