const PALETTE = {
  fukahi: {
    BG:       '#F4F0E8',
    SURFACE:  '#FFFFFF',
    BORDER:   '#E5DED4',
    TEXT:     '#1A1614',
    SUB:      '#8C7E74',
    ACCENT:   '#7C3A28',
    ACCENT_BG:'rgba(124,58,40,0.07)',
    AMBER:    '#D9A882',
    GREEN:    '#4A7A35',
    PHOTO_PH: '#2d2520',
    PHOTO_PH_ICON: 'rgba(255,245,230,0.1)',
  },
  suminagashi: {
    BG:       '#1C1C1E',
    SURFACE:  '#2C2A28',
    BORDER:   'rgba(200,180,140,0.16)',
    TEXT:     '#F7F3EC',
    SUB:      '#8C8076',
    ACCENT:   '#C0392B',
    ACCENT_BG:'rgba(192,57,43,0.12)',
    AMBER:    '#C9A56E',
    GREEN:    '#C9A56E',
    PHOTO_PH: '#252320',
    PHOTO_PH_ICON: 'rgba(247,243,236,0.08)',
  },
  aizome: {
    BG:       '#060e18',
    SURFACE:  '#0f2440',
    BORDER:   'rgba(200,225,255,0.16)',
    TEXT:     '#E8EFF8',
    SUB:      'rgba(180,210,245,0.52)',
    ACCENT:   '#B5451B',
    ACCENT_BG:'rgba(181,69,27,0.18)',
    AMBER:    'rgba(180,210,245,0.7)',
    GREEN:    '#3A8A50',
    PHOTO_PH: '#0d2244',
    PHOTO_PH_ICON: 'rgba(180,210,245,0.1)',
  },
}
const W = 1080, H = 1440
const PAD = 64

async function loadImage(url) {
  // Fetch as blob to avoid canvas CORS taint from cached opaque responses
  const res = await fetch(url)
  if (!res.ok) throw new Error('fetch failed')
  const blobUrl = URL.createObjectURL(await res.blob())
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => { URL.revokeObjectURL(blobUrl); reject() }
    img.src = blobUrl
  })
}

function roundPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function wrapText(ctx, text, maxWidth) {
  const chars = [...text]
  let line = '', lines = []
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line); line = ch
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}

function drawWave(ctx, x, y, w, accent) {
  const segs = 12, segW = w / segs
  ctx.beginPath()
  for (let i = 0; i <= segs; i++) {
    const px = x + i * segW
    const amp = i % 2 === 0 ? -4 : 4
    if (i === 0) ctx.moveTo(px, y)
    else ctx.quadraticCurveTo(x + (i - 0.5) * segW, y + amp * -1, px, y + amp)
  }
  ctx.strokeStyle = accent
  ctx.globalAlpha = 0.3
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.globalAlpha = 1
}

function drawStars(ctx, x, y, rating, size, amber) {
  ctx.font = `300 ${size}px "Noto Serif JP"`
  ctx.fillStyle = amber
  ctx.fillText('★'.repeat(rating) + '☆'.repeat(5 - rating), x, y)
}

// Returns next y after drawing all tags
function drawTags(ctx, labels, x, y, maxW, bg, fg, fontSize = 26) {
  if (!labels.length) return y
  ctx.font = `300 ${fontSize}px "Noto Serif JP"`
  const PH = 10, PV = 8, GAP = 8, ROW = fontSize + PV * 2 + 4
  let cx = x, cy = y
  labels.forEach(label => {
    const tw = ctx.measureText(label).width
    const tw2 = tw + PH * 2
    if (cx + tw2 > x + maxW && cx > x) { cx = x; cy += ROW + 6 }
    roundPath(ctx, cx, cy, tw2, ROW, ROW / 2)
    ctx.fillStyle = bg; ctx.fill()
    ctx.fillStyle = fg
    ctx.fillText(label, cx + PH, cy + PV + fontSize * 0.82)
    cx += tw2 + GAP
  })
  return cy + ROW + 10
}

function specLabel(key, lang) {
  return ({
    polishing: { ja: '精米歩合', zh: '精米步合', en: 'Polishing' },
    alcohol:   { ja: 'アルコール', zh: '酒精度', en: 'Alcohol' },
    smv:       { ja: '日本酒度', zh: '日本酒度', en: 'SMV' },
    acidity:   { ja: '酸度', zh: '酸度', en: 'Acidity' },
  })[key]?.[lang] || key
}

function cellLabel(key, lang) {
  return ({
    rice:     { ja: '原料米', zh: '酒米', en: 'Rice' },
    yeast:    { ja: '酵母',   zh: '酵母', en: 'Yeast' },
    bottling: { ja: '装瓶日', zh: '裝瓶日', en: 'Bottling' },
    drinking: { ja: '飲用日', zh: '品飲日', en: 'Tasted' },
  })[key]?.[lang] || key
}

function addPct(val) {
  const s = String(val)
  return s.includes('%') ? s : s + '%'
}

export async function generateShareCard(entry, lang = 'ja', theme = 'fukahi') {
  const { BG, SURFACE, BORDER, TEXT, SUB, ACCENT, ACCENT_BG, AMBER, GREEN, PHOTO_PH, PHOTO_PH_ICON } = PALETTE[theme] || PALETTE.fukahi
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  await document.fonts.ready

  // ── Page background ──────────────────────────────────────────────
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)

  // ── Card body ─────────────────────────────────────────────────────
  roundPath(ctx, PAD - 8, 48, W - (PAD - 8) * 2, H - 96, 24)
  ctx.fillStyle = SURFACE
  ctx.fill()
  ctx.strokeStyle = BORDER
  ctx.lineWidth = 1.5
  ctx.stroke()

  let y = 100

  // ── Top section: photo + info ─────────────────────────────────────
  const PHOTO_W = 176, PHOTO_H = 220, PHOTO_X = PAD + 8
  const INFO_X = PHOTO_X + PHOTO_W + 28
  const INFO_W = W - INFO_X - PAD - 8

  // Photo (if available)
  let hasPhoto = false
  if (entry.photo_url) {
    try {
      const img = await loadImage(entry.photo_url)
      const scale = Math.max(PHOTO_W / img.width, PHOTO_H / img.height)
      const dw = img.width * scale, dh = img.height * scale
      const dx = PHOTO_X + (PHOTO_W - dw) / 2, dy = y
      ctx.save()
      roundPath(ctx, PHOTO_X, y, PHOTO_W, PHOTO_H, 14)
      ctx.clip()
      ctx.drawImage(img, dx, dy, dw, dh)
      ctx.restore()
      hasPhoto = true
    } catch (_) {}
  }

  if (!hasPhoto) {
    roundPath(ctx, PHOTO_X, y, PHOTO_W, PHOTO_H, 14)
    ctx.fillStyle = PHOTO_PH
    ctx.fill()
    ctx.font = '300 72px "Noto Serif JP"'
    ctx.fillStyle = PHOTO_PH_ICON
    ctx.textAlign = 'center'
    ctx.fillText('🍶', PHOTO_X + PHOTO_W / 2, y + PHOTO_H / 2 + 28)
    ctx.textAlign = 'left'
  }

  // Type tag
  let iy = y + 8
  if (entry.type) {
    ctx.font = '300 24px "Noto Serif JP"'
    ctx.fillStyle = ACCENT
    ctx.fillText(entry.type, INFO_X, iy + 24)
    iy += 42
  }

  // Sake name
  ctx.font = '600 52px "Noto Serif JP"'
  ctx.fillStyle = TEXT
  wrapText(ctx, entry.name, INFO_W).slice(0, 2).forEach(line => {
    ctx.fillText(line, INFO_X, iy + 52); iy += 62
  })

  // Brewery
  if (entry.brewery) {
    ctx.font = '300 28px "Noto Serif JP"'
    ctx.fillStyle = SUB
    ctx.fillText(entry.brewery, INFO_X, iy + 28); iy += 40
  }

  // Region + date
  const metaParts = [entry.region, entry.tasted_at].filter(Boolean)
  if (metaParts.length) {
    ctx.font = '300 24px "Noto Serif JP"'
    ctx.fillStyle = SUB
    ctx.fillText(metaParts.join('  ·  '), INFO_X, iy + 24); iy += 36
  }

  // Stars
  if (entry.rating) {
    iy += 6
    drawStars(ctx, INFO_X, iy + 28, entry.rating, 30, AMBER)
    iy += 40
  }

  y = Math.max(y + PHOTO_H, iy) + 28

  // ── Wave divider ──────────────────────────────────────────────────
  drawWave(ctx, PAD + 8, y, W - (PAD + 8) * 2, ACCENT)
  y += 28

  // ── Stats bar ─────────────────────────────────────────────────────
  const STATS = [
    [specLabel('polishing', lang), entry.polishing && addPct(entry.polishing)],
    [specLabel('alcohol',   lang), entry.alcohol   && addPct(entry.alcohol)],
    [specLabel('smv',       lang), entry.smv       && String(entry.smv)],
    [specLabel('acidity',   lang), entry.acidity   && String(entry.acidity)],
  ]
  const STAT_W = (W - (PAD + 8) * 2) / 4
  STATS.forEach(([label, val], i) => {
    const sx = PAD + 8 + i * STAT_W
    ctx.font = '300 22px "Noto Serif JP"'
    ctx.fillStyle = SUB
    ctx.fillText(label, sx + 14, y + 28)
    if (val) {
      ctx.font = `400 ${val.length > 6 ? 30 : 38}px "Noto Serif JP"`
      ctx.fillStyle = TEXT
      ctx.fillText(val, sx + 14, y + 72)
    } else {
      ctx.font = '300 28px "Noto Serif JP"'
      ctx.fillStyle = BORDER
      ctx.fillText('—', sx + 14, y + 72)
    }
    if (i < 3) {
      ctx.strokeStyle = BORDER
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(sx + STAT_W, y + 10); ctx.lineTo(sx + STAT_W, y + 82); ctx.stroke()
    }
  })
  y += 100

  // ── Wave divider ──────────────────────────────────────────────────
  drawWave(ctx, PAD + 8, y, W - (PAD + 8) * 2, ACCENT)
  y += 28

  // ── Detail cells (2-col grid) ─────────────────────────────────────
  const CELLS = [
    [cellLabel('rice',     lang), entry.rice],
    [cellLabel('yeast',    lang), entry.yeast],
    [cellLabel('bottling', lang), entry.bottling_date],
    [cellLabel('drinking', lang), entry.tasted_at],
  ]
  const CELL_W = (W - (PAD + 8) * 2) / 2
  CELLS.forEach(([label, val], i) => {
    const cx = PAD + 8 + (i % 2) * CELL_W
    const cy = y + Math.floor(i / 2) * 72
    ctx.font = '300 20px "Noto Serif JP"'
    ctx.fillStyle = SUB
    ctx.fillText(label, cx + 8, cy + 22)
    ctx.font = '300 28px "Noto Serif JP"'
    ctx.fillStyle = val ? TEXT : BORDER
    ctx.fillText(val || '—', cx + 8, cy + 54)
    ctx.strokeStyle = BORDER; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(cx, cy + 64); ctx.lineTo(cx + CELL_W - 8, cy + 64); ctx.stroke()
  })
  y += 152

  // ── Aroma tags ────────────────────────────────────────────────────
  if (entry.aroma_tags?.length) {
    ctx.font = '300 22px "Noto Serif JP"'
    ctx.fillStyle = SUB
    ctx.fillText({ ja: '香り', zh: '香氣', en: 'Aroma' }[lang] || '香り', PAD + 8, y + 22)
    y += 32
    y = drawTags(ctx, entry.aroma_tags_labels || entry.aroma_tags, PAD + 8, y, W - (PAD + 8) * 2, ACCENT_BG, ACCENT, 24)
    y += 4
  }

  // ── Taste tags ────────────────────────────────────────────────────
  if (entry.taste_tags?.length) {
    ctx.font = '300 22px "Noto Serif JP"'
    ctx.fillStyle = SUB
    ctx.fillText({ ja: '味わい', zh: '口感', en: 'Taste' }[lang] || '味わい', PAD + 8, y + 22)
    y += 32
    y = drawTags(ctx, entry.taste_tags_labels || entry.taste_tags, PAD + 8, y, W - (PAD + 8) * 2, BG, TEXT, 24)
    y += 4
  }

  // ── Notes ─────────────────────────────────────────────────────────
  const noteText = [entry.aroma, entry.taste, entry.notes].filter(Boolean).join('  /  ')
  if (noteText) {
    ctx.font = '300 26px "Noto Serif JP"'
    ctx.fillStyle = SUB
    wrapText(ctx, noteText, W - (PAD + 8) * 2 - 16).slice(0, 3).forEach(line => {
      ctx.fillText(line, PAD + 16, y + 26); y += 36
    })
    y += 10
  }

  // ── Footer ────────────────────────────────────────────────────────
  const FOOTER_Y = H - 68
  ctx.beginPath()
  ctx.arc(PAD + 24, FOOTER_Y, 5, 0, Math.PI * 2)
  ctx.fillStyle = GREEN; ctx.fill()

  ctx.font = '300 26px "Noto Serif JP"'
  ctx.fillStyle = SUB
  ctx.globalAlpha = 0.65
  ctx.fillText('酒記録 Kikiroku  ·  kikiroku.com', PAD + 40, FOOTER_Y + 10)
  ctx.globalAlpha = 1

  return canvas
}

export function canvasToBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}
