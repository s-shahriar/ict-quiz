import { X, LayoutGrid } from 'lucide-react'

export default function CategorySidebar({ topics, currentTopicId, open, onClose, onSelect }) {
  return (
    <>
      {open && (
        <div className="cat-sidebar-overlay" onClick={onClose} />
      )}
      <aside className={`cat-sidebar${open ? ' open' : ''}`}>
        <div className="cat-sidebar-header">
          <span className="cat-sidebar-title">
            <LayoutGrid size={15} />
            Categories
          </span>
          <button className="cat-sidebar-close" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>
        <div className="cat-sidebar-list">
          {topics.map(t => {
            const Icon = t.icon
            const isCurrent = t.id === currentTopicId
            return (
              <button
                key={t.id}
                className={`cat-sidebar-item${isCurrent ? ' current' : ''}`}
                style={{ '--tc': t.color }}
                onClick={() => { if (!isCurrent) { onSelect(t); onClose() } }}
                disabled={isCurrent}
              >
                <span className="cat-sidebar-icon">
                  <Icon size={14} />
                </span>
                <span className="cat-sidebar-name">{t.name}</span>
                {isCurrent && <span className="cat-sidebar-badge">current</span>}
              </button>
            )
          })}
        </div>
      </aside>
    </>
  )
}
