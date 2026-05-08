import Text from '@/components/ui/text'

// ─── Icons ────────────────────────────────────────────────────────────────────

export function ChevronRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
    </svg>
  )
}

export function ChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M3.22 6.22a.75.75 0 0 1 1.06 0L8 9.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 7.28a.75.75 0 0 1 0-1.06Z" />
    </svg>
  )
}

export function FolderIcon({ open, className }: { open: boolean; className?: string }) {
  return open ? (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M1.75 4.5h4.586a.25.25 0 0 1 .177.073l.927.927c.14.14.331.22.53.22h6.28c.138 0 .25.112.25.25v7.28a.75.75 0 0 1-.75.75H1.75a.75.75 0 0 1-.75-.75V5.25a.75.75 0 0 1 .75-.75Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M1.75 4.5h4.586a.25.25 0 0 1 .177.073l.927.927c.14.14.331.22.53.22h6.28c.138 0 .25.112.25.25v7.28a.75.75 0 0 1-.75.75H1.75a.75.75 0 0 1-.75-.75V5.25a.75.75 0 0 1 .75-.75ZM1 5.25v7.03c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25V5.5a.75.75 0 0 0-.75-.75H8a.75.75 0 0 1-.53-.22L6.543 3.6A1.75 1.75 0 0 0 5.306 3H1.75A.75.75 0 0 0 1 3.75v1.5Z" />
    </svg>
  )
}

export function FileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M2 1.75A1.75 1.75 0 0 1 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 8.75 4.25V1.5Zm6.75.988V4.25c0 .138.112.25.25.25h1.762Z" />
    </svg>
  )
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

export function Breadcrumb({ parts, onClose }: { parts: string[]; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <div className="flex items-center gap-1.5 text-sm text-gray-300 min-w-0">
        {parts.map((part, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
            <span className={`truncate ${i === parts.length - 1 ? 'text-gray-400 font-medium' : ''}`}>
              {part}
            </span>
          </span>
        ))}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 flex items-center gap-1 text-xs text-white bg-teal-base hover:bg-teal-dark border border-teal-base rounded px-2 py-1 transition-colors"
      >
        <span>✕</span>
        <span>Fechar</span>
      </button>
    </div>
  )
}

// ─── Tree rows ────────────────────────────────────────────────────────────────

export function ItemRow({ label, count, depth, onClick }: {
  label: string
  count?: number
  depth: number
  onClick: () => void
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 group select-none"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={onClick}
    >
      <FileIcon className="w-3.5 h-3.5 text-gray-300 shrink-0" />
      <span className="text-sm text-gray-400 flex-1 truncate group-hover:text-teal-base transition-colors">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-gray-300 tabular-nums shrink-0">{count}</span>
      )}
    </div>
  )
}

// ─── RH Pagination ───────────────────────────────────────────────────────────

export function RhPagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <Text variant="caption" className="text-gray-300">
        {from}–{to} de {total} respostas
      </Text>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-400 hover:border-teal-base hover:text-teal-base disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              p === page
                ? 'border-teal-base bg-teal-base text-white'
                : 'border-gray-200 text-gray-400 hover:border-teal-base hover:text-teal-base'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-400 hover:border-teal-base hover:text-teal-base disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  )
}

export function FolderRow({ label, count, open, depth, onToggle }: {
  label: string
  count: number
  open: boolean
  depth: number
  onToggle: () => void
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 group select-none"
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
      onClick={onToggle}
    >
      {open
        ? <ChevronDown className="w-3 h-3 text-gray-300 shrink-0" />
        : <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
      }
      <FolderIcon
        open={open}
        className={`w-3.5 h-3.5 shrink-0 transition-colors ${open ? 'text-teal-base' : 'text-yellow-500'}`}
      />
      <span className="text-sm font-medium text-gray-400 flex-1 truncate group-hover:text-teal-base transition-colors">
        {label}
      </span>
      <span className="text-xs text-gray-300 tabular-nums shrink-0">{count}</span>
    </div>
  )
}
