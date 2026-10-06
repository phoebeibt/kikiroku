// Spread onto a non-button element that opens something on click,
// so it is reachable and operable from the keyboard.
export const pressable = (onActivate, label) => ({
  role: 'button',
  tabIndex: 0,
  'aria-label': label,
  onClick: onActivate,
  onKeyDown: e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(e) }
  },
})
