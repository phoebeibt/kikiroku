import { Resvg } from '@resvg/resvg-js'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')
mkdirSync(publicDir, { recursive: true })

// Exact paths from brand doc App Icon (viewBox 32×32, translate 16,16)
// Center circle changed from cream to #5C8A42 (muted sage green, pairs well with 朱木)
function iconSvg() {
  return `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="7" fill="#7C3A28"/>
  <g transform="translate(16,16)">
    <path d="M-5,-13 C-10,-10 -14,-5 -14,2 C-14,8 -10,12 -4,13 C2,14 8,11 11,6 C13,2 12,-4 8,-8 C5,-11 1,-13 -2,-13"
      fill="none" stroke="#F4F0E8" stroke-width="1" opacity="0.35" stroke-linecap="round"/>
    <path d="M-3,-9 C-7,-7 -10,-3 -10,2 C-10,7 -7,10 -2,11 C3,12 8,9 10,5 C11,2 10,-3 7,-6 C4,-8 0,-9 -2,-9"
      fill="none" stroke="#F4F0E8" stroke-width="1.3" opacity="0.65" stroke-linecap="round"/>
    <circle r="4" fill="#5C8A42"/>
  </g>
</svg>`
}

const svg = iconSvg()
for (const size of [180, 192, 512]) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  writeFileSync(join(publicDir, `icon-${size}.png`), png)
  console.log(`✓ icon-${size}.png`)
}
