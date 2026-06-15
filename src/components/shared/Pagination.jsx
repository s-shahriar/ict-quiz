import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onPageChange }) {
  function getPageNums() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    // Show a sliding window of 5 consecutive pages around the current one,
    // plus the first/last pages with ellipses where there's a gap.
    let start = Math.max(1, page - 2)
    let end = Math.min(totalPages, start + 4)
    start = Math.max(1, end - 4)
    const pages = []
    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push('...')
    }
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="pagination">
      <button
        className="pag-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={15} />
      </button>
      {getPageNums().map((p, i) =>
        p === '...'
          ? <span key={`e${i}`} className="pag-ellipsis">…</span>
          : <button
              key={p}
              className={`pag-btn${p === page ? ' active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
      )}
      <button
        className="pag-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  )
}
