import { useMemo } from 'react'
import { ViewportPortal } from '@xyflow/react'

import { useTreeStore } from '../store/useTreeStore.js'
import { computeStageHeaderRowY, findMainPathNodes } from '../store/treeUtils.js'

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
  const edges = useTreeStore((s) => s.edges)
  const labels = useTreeStore((s) => s.stageColumnLabels)
  const setStageColumnLabel = useTreeStore((s) => s.setStageColumnLabel)
  const evaluationMode = useTreeStore((s) => s.evaluationMode);
  const setEvaluationMode = useTreeStore((s) => s.setEvaluationMode);


  const rowY = useMemo(() => computeStageHeaderRowY(nodes), [nodes])

  // Znajdujemy faktyczne osie pionowe wszystkich kolumn
  const columnXs = useMemo(() => {
    const mainPathNodes = findMainPathNodes(nodes, edges); // Get the main path
    const xs = mainPathNodes.map(n => n.position.x + 22); // środek węzła 44px
    const unique = [];
    xs.forEach(x => {
      if (!unique.some(ux => Math.abs(ux - x) < 5)) {
        unique.push(x);
      }
    });
    return unique.sort((a, b) => a - b);
  }, [nodes, edges]);

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
                className="box-border h-8 w-full rounded border border-slate-400 bg-white/95 px-1.5 text-center text-[11px] font-semibold text-slate-800 shadow-sm outline-none backdrop-blur-sm placeholder:text-slate-400 focus-visible:border-slate-900 dark:border-slate-500 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-slate-300"
              />
              {isLast && (
                <button
                  onClick={handleToggleMode}
                  className='absolute -right-4 top-1/2 -translate-y-1/2 translate-x-full flex items-center gap-1.5 whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold border border-green-500 text-green-700  hover:bg-green-300 transition-colors'
                >
                  <span className="text-base leading-none">
                    {evaluationMode === 'max' ? '⭡' : '⭣'}
                  </span>
                  <span>
                    {evaluationMode === 'max' ? 'Better [Max]' : 'Better [Min]'}
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