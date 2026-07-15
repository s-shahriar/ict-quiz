import { Hand } from 'lucide-react'
import { useHandContext } from '../../contexts/HandContext.jsx'

export default function HandToggle({ className = 'study-home-btn', size = 16 }) {
  const { hand, toggleHand } = useHandContext()
  const label = hand === 'left'
    ? 'Left-hand layout — switch to right'
    : 'Right-hand layout — switch to left'

  return (
    <button className={`${className} hand-toggle`} onClick={toggleHand} title={label} aria-label={label}>
      <Hand size={size} />
    </button>
  )
}
