// プロフ avatars: 9 tanuki tiles chosen from the designer's sheets (expression v1/v2, behaviour scenes).
// Stored as user_metadata.avatar = id; files live in /public/avatars/<id>.webp.
// An id that is no longer offered falls back to the default.
export const AVATARS = ['expr-01', 'expr-04', 'expr-02', 'calm-04', 'scene-01', 'expr-05', 'calm-06', 'scene-04', 'expr-08']
export const DEFAULT_AVATAR = 'expr-01'
export const avatarSrc = id => `/avatars/${AVATARS.includes(id) ? id : DEFAULT_AVATAR}.webp`
