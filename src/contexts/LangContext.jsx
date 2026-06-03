import { createContext, useContext, useState } from 'react'
import { getT } from '../lib/i18n'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('kikiroku-lang') || 'ja'
  )
  const changeLang = l => { setLang(l); localStorage.setItem('kikiroku-lang', l) }
  const t = getT(lang)
  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
