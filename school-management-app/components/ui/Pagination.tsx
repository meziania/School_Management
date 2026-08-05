'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  pageSizeOptions?: number[]
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  if (totalItems === 0) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 bg-white border-t border-slate-200/80 rounded-b-2xl">
      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
        <span>
          Affichage de <strong className="text-slate-800 font-bold">{startItem}</strong> à{' '}
          <strong className="text-slate-800 font-bold">{endItem}</strong> sur{' '}
          <strong className="text-slate-800 font-bold">{totalItems}</strong> éléments
        </span>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
            <span>Afficher</span>
            <select
              value={itemsPerPage}
              onChange={e => {
                onItemsPerPageChange(Number(e.target.value))
                onPageChange(1)
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>par page</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((page, idx, arr) => {
              const prevPage = arr[idx - 1]
              const showEllipsis = prevPage && page - prevPage > 1

              return (
                <div key={page} className="flex items-center gap-1">
                  {showEllipsis && <span className="text-slate-400 text-xs px-1">...</span>}
                  <button
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 text-xs font-extrabold rounded-lg transition ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {page}
                  </button>
                </div>
              )
            })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="Page suivante"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
