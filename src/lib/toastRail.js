// Single top-right rail shared by every transient chip (offline-sync status and
// the Recycle Bin toast). They live in different React trees, so they portal into
// one lazily-created DOM node instead of each pinning itself to the corner —
// that way they stack in a column and can never overlap each other.

let el = null

export function getToastRail() {
  if (typeof document === 'undefined') return null
  if (!el || !el.isConnected) {
    el = document.createElement('div')
    el.className = 'toast-rail'
    document.body.appendChild(el)
  }
  return el
}
