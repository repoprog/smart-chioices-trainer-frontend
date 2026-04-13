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
      <button
        type="button"
        title="Dodaj gałąź"
        aria-label="Dodaj gałąź"
        aria-expanded={open}
        className="mb-1 flex h-7 w-7 items-center justify-center border border-slate-900 bg-white font-sans text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 pointer-events-auto"
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
          className="absolute left-0 top-full z-[100] mt-0 min-w-[11rem] border border-slate-900 bg-white py-1 shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left font-sans text-xs font-medium text-slate-900 hover:bg-slate-100"
            onClick={() => pick('chance')}
          >
            Niepewność
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left font-sans text-xs font-medium text-slate-900 hover:bg-slate-100"
            onClick={() => pick('terminal')}
          >
            Konsekwencja
          </button>
        </div>
      ) : null}
    </div>
  )
}
