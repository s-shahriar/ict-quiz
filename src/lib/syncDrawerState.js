// Open/close state for the sync drawer, held outside React.
//
// The drawer is mounted once at the app root, but it is opened from the queue
// pill (portalled into the toast rail) and from the sync button in the top-bar
// cluster, which every subroute renders at its own depth. A module-level store
// lets any of them reach it without threading a callback through the tree.

let isOpen = false
const subscribers = new Set()

function set(next) {
  if (isOpen === next) return
  isOpen = next
  subscribers.forEach((fn) => fn(isOpen))
}

export function openSyncDrawer() { set(true) }
export function closeSyncDrawer() { set(false) }

export function subscribeSyncDrawer(fn) {
  subscribers.add(fn)
  fn(isOpen)
  return () => subscribers.delete(fn)
}
