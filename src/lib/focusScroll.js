// Reliably bring a deep-linked element into view. Tries immediately, retries a
// few times if the node isn't mounted yet (lazy routes / late render), then
// re-centers a couple times as fonts/images settle, and pulses the target.
//
// Uses setTimeout (not requestAnimationFrame) so it also works under headless
// virtual-time rendering, where rAF callbacks may not fire.
//
// Returns a cleanup function for use from useEffect.
export function focusScroll(getEl) {
  let cancelled = false
  let pulseTimer = null
  let findTries = 0
  let corrections = 0

  const step = () => {
    if (cancelled) return
    const el = getEl()
    if (!el) {
      if (findTries++ < 40) setTimeout(step, 16)
      return
    }
    el.scrollIntoView({ block: 'center' })
    if (corrections++ < 3) {
      setTimeout(step, 120)
      return
    }
    el.classList.add('gs-focus-pulse')
    pulseTimer = setTimeout(() => el.classList.remove('gs-focus-pulse'), 2200)
  }

  step()

  return () => {
    cancelled = true
    if (pulseTimer) clearTimeout(pulseTimer)
  }
}
