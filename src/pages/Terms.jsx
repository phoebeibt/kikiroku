import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const LANGS = ['ja', 'zh', 'en']
const LANG_LABEL = { ja: '日本語', zh: '繁體中文', en: 'English' }

const content = {
  ja: {
    title: '利用規約',
    updated: '最終更新：2026年6月11日',
    sections: [
      {
        heading: '1. サービス概要',
        body: 'kikiroku（以下「本サービス」）は、日本酒の記録・管理を目的としたWebアプリケーションです。本規約に同意することで、本サービスをご利用いただけます。',
      },
      {
        heading: '2. 年齢制限',
        body: '本サービスはアルコール飲料（日本酒）を扱う性質上、20歳以上の方のみご利用いただけます。お住まいの国・地域の法定飲酒年齢が20歳を超える場合は、その年齢以上であることが必要です。',
      },
      {
        heading: '3. アカウント',
        body: 'アカウントの登録情報は正確に入力してください。パスワードの管理はご自身の責任において行ってください。アカウントの不正利用が発覚した場合は、直ちにご連絡ください。',
      },
      {
        heading: '4. ユーザーコンテンツ',
        body: 'お客様が投稿した記録・写真・テキスト（以下「コンテンツ」）の著作権はお客様に帰属します。投稿により、kikirokuに対してサービスの運営・表示・改善に必要な範囲でコンテンツを利用する非独占的ライセンスを付与するものとします。他者の著作権・肖像権・プライバシーを侵害するコンテンツの投稿は禁止します。',
      },
      {
        heading: '5. 禁止事項',
        body: '以下の行為を禁止します：虚偽情報の入力・公開、他者への嫌がらせ・誹謗中傷、本サービスへの自動アクセス・スクレイピング、サービスの逆コンパイル・改変、その他法令に違反する行為。',
      },
      {
        heading: '6. AI機能について',
        body: '本サービスは日本酒情報の補完にAI（Google Gemini）を使用しています。AI により生成された情報（銘柄・規格・産地等）は不正確な場合があります。公式情報は各酒蔵・販売元にてご確認ください。',
      },
      {
        heading: '7. プライバシー',
        body: 'ご入力いただいた情報はSupabase（米国）のサーバーに保存されます。個人情報を第三者に販売・提供することはありません。公開設定にした記録は、ログインしていないユーザーを含む誰でも閲覧できます。',
      },
      {
        heading: '8. 免責事項',
        body: '本サービスで提供する日本酒情報は参考目的のみです。飲酒に関する判断は自己責任で行ってください。本サービスの利用により生じた損害について、kikirokuは責任を負いません。',
      },
      {
        heading: '9. 規約の変更',
        body: '本規約は予告なく変更することがあります。変更後に本サービスを継続してご利用いただいた場合、変更後の規約に同意したものとみなします。',
      },
      {
        heading: '10. 準拠法・管轄',
        body: '本規約は日本法に準拠します。本サービスに関する紛争については、大阪地方裁判所を第一審の専属的合意管轄裁判所とします。',
      },
      {
        heading: 'お問い合わせ',
        body: 'ご質問・ご連絡は japan.phoebe@icloud.com までお送りください。',
      },
    ],
  },
  zh: {
    title: '服務條款',
    updated: '最後更新：2026年6月11日',
    sections: [
      {
        heading: '1. 服務概述',
        body: 'kikiroku（以下簡稱「本服務」）是一款以記錄和管理日本酒為目的的網頁應用程式。使用本服務即表示您同意本條款。',
      },
      {
        heading: '2. 年齡限制',
        body: '本服務涉及酒精飲料（日本酒），僅供20歲（含）以上之用戶使用。若您所在國家或地區的法定飲酒年齡高於20歲，則需達到當地規定的年齡方可使用。',
      },
      {
        heading: '3. 帳號',
        body: '請如實填寫帳號資料。請妥善保管您的密碼，帳號安全由您自行負責。如發現帳號遭到未授權使用，請立即與我們聯繫。',
      },
      {
        heading: '4. 用戶內容',
        body: '您發佈的記錄、照片及文字（以下簡稱「內容」）之著作權歸您所有。發佈內容即表示您授予 kikiroku 在服務運營、展示及改善所需範圍內使用該內容的非獨家授權。禁止發佈侵犯他人著作權、肖像權或隱私權的內容。',
      },
      {
        heading: '5. 禁止行為',
        body: '禁止以下行為：輸入或公開虛假資訊、騷擾或誹謗他人、對本服務進行自動化存取或爬蟲、逆向工程或修改本服務，以及任何違反法律的行為。',
      },
      {
        heading: '6. AI 功能說明',
        body: '本服務使用 AI（Google Gemini）來補全日本酒資訊。AI 生成的資訊（銘柄、規格、產地等）可能有誤，請以各酒藏或銷售商的官方資訊為準。',
      },
      {
        heading: '7. 隱私',
        body: '您輸入的資料儲存於 Supabase（美國）的伺服器。我們不會將個人資料出售或提供給第三方。設為公開的記錄，任何人（包括未登入用戶）均可瀏覽。',
      },
      {
        heading: '8. 免責聲明',
        body: '本服務提供的日本酒資訊僅供參考。飲酒行為請自行判斷並承擔責任。因使用本服務而造成的任何損失，kikiroku 不承擔責任。',
      },
      {
        heading: '9. 條款變更',
        body: '本條款可能隨時更新，恕不另行通知。更新後繼續使用本服務，即視為同意更新後的條款。',
      },
      {
        heading: '10. 準據法與管轄',
        body: '本條款依日本法律解釋。因本服務產生的糾紛，以大阪地方法院為第一審專屬合意管轄法院。',
      },
      {
        heading: '聯絡我們',
        body: '如有任何疑問，請來信 japan.phoebe@icloud.com。',
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    updated: 'Last updated: June 11, 2026',
    sections: [
      {
        heading: '1. About This Service',
        body: 'kikiroku is a web application for recording and managing sake (Japanese rice wine). By using this service, you agree to these terms.',
      },
      {
        heading: '2. Age Requirement',
        body: 'This service involves alcoholic beverages. You must be at least 20 years old to use kikiroku. If the legal drinking age in your country or region is higher than 20, you must meet that requirement.',
      },
      {
        heading: '3. Your Account',
        body: 'Please provide accurate information when registering. You are responsible for keeping your password secure. If you become aware of unauthorized access to your account, please contact us immediately.',
      },
      {
        heading: '4. User Content',
        body: 'You retain ownership of any records, photos, and text you post ("Content"). By posting, you grant kikiroku a non-exclusive license to use, display, and improve the service using that Content. Do not post content that infringes on the copyright, portrait rights, or privacy of others.',
      },
      {
        heading: '5. Prohibited Conduct',
        body: 'The following are prohibited: submitting or publishing false information; harassing or defaming others; automated access or scraping of this service; reverse engineering or modifying the service; any activity that violates applicable law.',
      },
      {
        heading: '6. AI-Powered Features',
        body: 'kikiroku uses AI (Google Gemini) to suggest and fill in sake information. AI-generated data (brand names, specs, region, etc.) may be inaccurate. Always verify important information with the official brewer or retailer.',
      },
      {
        heading: '7. Privacy',
        body: 'Your data is stored on Supabase servers (United States). We do not sell or share your personal information with third parties. Records you set to "public" are visible to anyone, including users who are not logged in.',
      },
      {
        heading: '8. Disclaimer',
        body: 'Sake information provided through this service is for reference only. Drink responsibly. kikiroku is not liable for any damages arising from your use of this service.',
      },
      {
        heading: '9. Changes to These Terms',
        body: 'We may update these terms at any time without prior notice. Your continued use of the service after any changes constitutes acceptance of the updated terms.',
      },
      {
        heading: '10. Governing Law',
        body: 'These terms are governed by the laws of Japan. Any disputes relating to this service shall be subject to the exclusive jurisdiction of the Osaka District Court as the court of first instance.',
      },
      {
        heading: 'Contact',
        body: 'For questions or concerns, email us at japan.phoebe@icloud.com.',
      },
    ],
  },
}

export default function Terms() {
  const [lang, setLang] = useState('ja')
  const nav = useNavigate()
  const c = content[lang]

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Back */}
        <button onClick={() => nav(-1)}
          style={{ background: 'none', border: 'none', color: 'var(--sub)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="m12 5-7 7 7 7"/>
          </svg>
          Back
        </button>

        {/* Lang toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {LANGS.map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{
                padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12,
                background: lang === l ? 'var(--accent)' : 'var(--surface)',
                color: lang === l ? '#fff' : 'var(--sub)',
                fontFamily: 'var(--font-sans)',
              }}>
              {LANG_LABEL[l]}
            </button>
          ))}
        </div>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600, marginBottom: 6 }}>
          {c.title}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 36 }}>{c.updated}</p>

        {c.sections.map((sec, i) => (
          <div key={i} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
              {sec.heading}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--sub)', lineHeight: 1.8 }}>
              {sec.body}
            </p>
          </div>
        ))}

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--border)', textAlign: 'center' }}>
          kikiroku
        </div>
      </div>
    </div>
  )
}
