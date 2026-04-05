import { useMemo } from 'react'
import { ViewportPortal } from '@xyflow/react'

import { useTreeStore } from '../store/useTreeStore.js'
import { computeStageHeaderRowY, getUniqueColumnXs } from '../store/treeUtils.js'

const ArrowUp = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5l0 14" />
    <path d="M18 11l-6 -6" />
    <path d="M6 11l6 -6" />
  </svg>
);

const ArrowDown = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5l0 14" />
    <path d="M18 13l-6 6" />
    <path d="M6 13l-6 6" />
  </svg>
);


export function StageHeadersFlow() {
  const nodes = useTreeStore((s) => s.nodes)
  // edges już tu nie pobieramy, nie są potrzebne do osi X!
  const labels = useTreeStore((s) => s.stageColumnLabels)
  const setStageColumnLabel = useTreeStore((s) => s.setStageColumnLabel)
  const evaluationMode = useTreeStore((s) => s.evaluationMode);
  const setEvaluationMode = useTreeStore((s) => s.setEvaluationMode);

  const rowY = useMemo(() => computeStageHeaderRowY(nodes), [nodes])

  // CZYŚCIUTKA LOGIKA:
  const columnXs = useMemo(() => {
    return getUniqueColumnXs(nodes).map(x => x + 22);
  }, [nodes]);

  if (!columnXs.length) return null

  const headerWidth = 160;

  const handleToggleMode = () => {
    setEvaluationMode(evaluationMode === 'max' ? 'min' : 'max');
  }

  return (
    <ViewportPortal>
      {/* Mapujemy po kolumnach, a nie po labels - to klucz do sukcesu! */}
      {columnXs.map((centerX, i) => {
        const text = labels[i] || ''; // Pobierz etykietę lub zostaw pustą
        const isLast = i === columnXs.length - 1;

        return (
          <div
            key={i}
            className="pointer-events-auto"
            style={{
              position: 'absolute',
              transform: `translate(${centerX - headerWidth / 2}px, ${rowY}px)`,
              width: `${headerWidth}px`,
              zIndex: -1,
            }}
          >
            <div className='relative w-full'>
  <input
    type="text"
    value={text}
    onChange={(e) => setStageColumnLabel(i, e.target.value)}
    placeholder={isLast ? "Konsekwencje" : `Etap ${i + 1}`}
    className="box-border h-8 w-full rounded border backdrop-blur-sm border-slate-400 bg-transparent px-1.5 text-center text-[11px] font-semibold text-slate-800 shadow-sm outline-none backdrop-blur-sm placeholder:text-slate-400  focus-visible:border-slate-900 dark:border-slate-500 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-slate-300"
  />
  {isLast && (
    <button
      onClick={handleToggleMode}
      title={evaluationMode === 'max' ? 'Zmień na poszukiwanie minimum (np. kosztów)' : 'Zmień na poszukiwanie maksimum (np. zysków)'}
      // Zamienione z cyan na emerald (szmaragdowy zielony), dopasowane do Twoich zysków
      className='absolute -right-2 top-1/2 flex h-8 -translate-y-1/2 translate-x-full cursor-pointer items-center gap-1.5 whitespace-nowrap rounded border bg-emerald-50 px-3 text-[11px] font-semibold shadow-sm transition-all backdrop-blur-sm border-emerald-400/80 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100 dark:border-emerald-700/80 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:border-emerald-600 dark:hover:bg-emerald-900'
    >
      <span className="text-sm leading-none font-bold text-emerald-600 dark:text-emerald-400">
        {evaluationMode === 'max' ? '⭡' : '⭣'}
      </span>
      <span>
        {evaluationMode === 'max' ? 'Lepiej [Max]' : 'Lepiej [Min]'}
      </span>
    </button>
  )}
</div>
          </div>
        )
      })}
    </ViewportPortal>
  )
}