/** Scroll the document only; scrolling carousel ancestors breaks slide positioning. */
export function scrollToAnchor(id: string): boolean {
  const target = document.getElementById(id)
  if (!target) return false
  const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0
  window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - margin), left: 0, behavior: 'instant' })
  return true
}
