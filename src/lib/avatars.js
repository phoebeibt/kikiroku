// プロフ avatars: 27 tanuki tiles cut from the designer's sheets (expression v1/v2, behaviour scenes).
// Stored as user_metadata.avatar = id; files live in /public/avatars/<id>.webp.
const range = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`)
export const AVATARS = [...range('expr', 9), ...range('calm', 6), ...range('scene', 12)]
export const DEFAULT_AVATAR = 'calm-01'
export const avatarSrc = id => `/avatars/${AVATARS.includes(id) ? id : DEFAULT_AVATAR}.webp`
