// Ratings are stored in 0.5 steps (numeric(2,1)); older records hold integers.
export function formatRating(rating) {
  if (rating == null || rating === '') return ''
  return (Math.round(Number(rating) * 2) / 2).toFixed(1)
}
