// Where to put the floating highlight bar for a given selection rectangle.
//
// Kept out of the component so the edge cases can be tested directly: a
// selection at the very top of the screen, at the very bottom, hard against the
// left or right edge, and on a narrow phone where the bar is a large fraction
// of the viewport width.
//
// Default is BELOW the selection. Android draws its own Copy/Share bar directly
// above the selection, so sitting below keeps the two from covering each other.
// It flips above only when there is no room below.

export const BAR_H = 44
export const GAP = 10
const EDGE = 8                  // keep this much clear of every viewport edge

// Horizontal clamp for a bar of a KNOWN width. The bar's width depends on its
// mode (four dots, or four dots plus a separator and a bin), so guessing it was
// wrong: an under-estimate let the bin hang off the edge of a phone. The
// component measures the rendered bar and re-clamps with the real number.
export function clampX(centerX, width, vw) {
  const half = width / 2
  if (width + EDGE * 2 >= vw) return vw / 2        // wider than the screen: centre it
  return Math.min(Math.max(centerX, half + EDGE), vw - half - EDGE)
}

export function placeBar(rect, vw, vh, width = 0) {
  const x = width ? clampX(rect.left + rect.width / 2, width, vw)
                  : rect.left + rect.width / 2     // provisional until measured

  const roomBelow = vh - rect.bottom - GAP - EDGE
  const roomAbove = rect.top - GAP - EDGE
  const above = roomBelow < BAR_H && roomAbove >= BAR_H

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

// The rect the bar will occupy. Used by the tests to assert it stays on screen.
export function barRect({ x, y, above }, width) {
  return {
    left: x - width / 2, right: x + width / 2,
    top: above ? y - BAR_H : y, bottom: above ? y : y + BAR_H,
  }
}
