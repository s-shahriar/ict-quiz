// Reliably bring a deep-linked element into view. Handles two races that made
// it flaky: (1) the element may not be mounted yet when the effect runs, and
// (2) layout shifts after the first scroll — study cards use
// `content-visibility: auto` (heights are estimated until rendered) and written
// cards expand on open. So we retry until the node exists, then re-center a few
// times as layout settles, and finally pulse it.
//
// Returns a cleanup function (cancel + clear timers) for use from useEffect.
export function focusScroll(getEl) {
  let cancelled = false
  let pulseTimer = null
  let findTries = 0
  let corrections = 0

  const step = () => {
    if (cancelled) return
    const el = getEl()
    if (!el) {
      if (findTries++ < 40) requestAnimationFrame(step)
      return
    }
    el.scrollIntoView({ block: 'center' }) // instant — avoids fighting layout shift
    if (corrections++ < 4) {
      setTimeout(step, 110)
      return
    }
    el.classList.add('gs-focus-pulse')
    pulseTimer = setTimeout(() => el.classList.remove('gs-focus-pulse'), 2200)
  }

  requestAnimationFrame(step)

  return () => {
    cancelled = true
    if (pulseTimer) clearTimeout(pulseTimer)
  }
}
