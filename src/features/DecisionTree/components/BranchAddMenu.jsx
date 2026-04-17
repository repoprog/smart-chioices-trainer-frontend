import { useCallback, useState } from 'react'
import { useTreeStore } from '../store/useTreeStore.js'

export function BranchAddMenu({ nodeId }) {
  const addBranch = useTreeStore((s) => s.addBranch)
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  const pick = useCallback(
    (kind) => {
      addBranch(nodeId, kind)
      close()
    },
    [addBranch, nodeId, close],
  )

  return (
    <div
      className="relative"
      onMouseLeave={() => setOpen(false)}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* REFACTOR: bg-card, border-border, hover:bg-muted */}
      <button
        type="button"
        title="Dodaj gałąź"
        aria-label="Dodaj gałąź"
        aria-expanded={open}
        className="mb-1 flex h-7 w-7 items-center justify-center rounded border border-border bg-card font-sans text-sm font-semibold text-foreground shadow-sm hover:bg-muted pointer-events-auto transition-colors"
        onMouseEnter={() => setOpen(true)}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        +
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Wybór typu nowej gałęzi"
          className="absolute left-0 top-full z-[100] mt-1 min-w-[11rem] overflow-hidden rounded-md border border-border bg-card py-1 shadow-md animate-in fade-in zoom-in-95"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left font-sans text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={() => pick('chance')}
          >
            Niepewność
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left font-sans text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={() => pick('terminal')}
          >
            Konsekwencja
          </button>
        </div>
      ) : null}
    </div>
  )
}