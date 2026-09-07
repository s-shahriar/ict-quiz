// Where to put the floating highlight bar for a given selection rectangle.
//
// Kept out of the component so the edge cases can be tested directly: a
// selection at the very top of the screen, at the very bottom, hard against
// the left or right edge, and on a narrow phone where the bar is a large
// fraction of the viewport width.
//
// Default is BELOW the selection. Android draws its own Copy/Share bar directly
// above the selection, so sitting below keeps the two from covering each other.
// It flips above only when there is no room below.

export const BAR_W = 132        // approx; only used for horizontal clamping
export const BAR_H = 40
export const GAP = 10
const EDGE = 8                  // keep this much clear of every viewport edge

export function placeBar(rect, vw, vh) {
  const half = BAR_W / 2
  const x = Math.min(Math.max(rect.left + rect.width / 2, half + EDGE), vw - half - EDGE)

  const roomBelow = vh - rect.bottom - GAP - EDGE
  const roomAbove = rect.top - GAP - EDGE
  let above = roomBelow < BAR_H && roomAbove >= BAR_H

  // Neither side fits (a selection taller than the screen): pin it inside the
  // viewport rather than letting it hang off an edge.
  let y
  if (above) {
    y = rect.top - GAP
    if (y - BAR_H < EDGE) y = EDGE + BAR_H
  } else {
    y = rect.bottom + GAP
    if (y + BAR_H > vh - EDGE) y = vh - EDGE - BAR_H
    if (y < EDGE) y = EDGE
  }
  return { x, y, above }
}

// The rect the bar will actually occupy, given placeBar's output. Used by the
// tests to assert it stays on screen.
export function barRect({ x, y, above }) {
  return { left: x - BAR_W / 2, right: x + BAR_W / 2, top: above ? y - BAR_H : y, bottom: above ? y : y + BAR_H }
}
