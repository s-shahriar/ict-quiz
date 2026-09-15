// Floating copy of the question while reading a long open answer.
//
// Once a card's header has scrolled up under the top bar, the answer below it
// has lost its question — on a phone a long answer means scrolling all the way
// back up just to re-read what was asked. This bar pins itself just under the
// top bar for as long as that card's body is on screen, and goes away with it.
//
// It lives at the top of WrittenCardBody as a zero-height sticky wrapper, so it
// takes no room in the layout, and sticky keeps it inside its own card — two open
// cards never stack two bars. That needs no clipping ancestor between it and the
// page: .written-card uses `overflow: clip`, not `hidden`, for exactly this.
//
// Long questions show two lines; tapping the text opens the whole question in
// place. The arrow scrolls back to the real header.

import { ArrowUp, ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import WrittenQuestionText from './WrittenQuestionText.jsx'

// Only the category screens have a sticky top bar; the Important/Nailed screens
// scroll theirs away, so there the bar pins to the very top.
const TOPBAR = '.written-topbar'

export default function QuestionPeek({ text, topicColor }) {
  const wrapRef = useRef(null)
  const textRef = useRef(null)
  const [top, setTop] = useState(0)
  const [shown, setShown] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const body = wrapRef.current?.parentElement
      if (!body) return
      const bar = document.querySelector(TOPBAR)
      const barBottom = bar ? Math.max(0, Math.round(bar.getBoundingClientRect().bottom)) : 0
      const r = body.getBoundingClientRect()
      setTop(barBottom)
      // The header sits directly above the body, so it is out of sight once the
      // body's top passes under the bar. Stop a little before the card ends so
      // the bar never covers the answer's last lines.
      setShown(r.top < barBottom && r.bottom > barBottom + 140)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (!shown) { setExpanded(false); return }
    const el = textRef.current
    if (el && !expanded) setClamped(el.scrollHeight > el.clientHeight + 1)
  }, [shown, expanded, text])

  const jumpToQuestion = (e) => {
    e.stopPropagation()
    const card = wrapRef.current?.closest('.written-card')
    const header = card?.querySelector('.written-card-header') ?? card
    if (!header) return
    window.scrollTo({ top: window.scrollY + header.getBoundingClientRect().top - top - 8 })
  }

  const toggle = () => { if (clamped || expanded) setExpanded(v => !v) }

  return (
    <div ref={wrapRef} className="wpeek-sticky" style={{ top }}>
      <div
        className={`wpeek${shown ? ' show' : ''}${expanded ? ' expanded' : ''}${clamped ? ' clamped' : ''}`}
        style={{ '--c': topicColor }}
        aria-hidden={!shown}
      >
        <div
          className="wpeek-main"
          role="button"
          tabIndex={shown ? 0 : -1}
          onClick={toggle}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
          title={expanded ? 'ছোট করো' : clamped ? 'পুরো প্রশ্ন দেখো' : undefined}
        >
          <span className="wpeek-label">
            প্রশ্ন
            {(clamped || expanded) && (expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
          </span>
          <div ref={textRef} className="wpeek-q">
            <WrittenQuestionText text={text} className="written-qtext" />
          </div>
        </div>
        <button className="wpeek-jump" onClick={jumpToQuestion} tabIndex={shown ? 0 : -1} title="প্রশ্নে ফিরে যাও">
          <ArrowUp size={15} />
        </button>
      </div>
    </div>
  )
}
