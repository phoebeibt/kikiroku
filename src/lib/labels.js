// Tag labels keep a reading in brackets, e.g. 「洋梨（ようなし）」. Strip it where space is tight.
export const cleanLabel = s => (s || '').replace(/[(（][぀-ゟ゠-ヿ\s]+[)）]/g, '').trim()
