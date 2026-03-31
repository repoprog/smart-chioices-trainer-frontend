import { useMemo } from 'react'
import { ViewportPortal } from '@xyflow/react'

import { useTreeStore } from '../store/useTreeStore.js'
import { computeStageHeaderRowY, findMainPathNodes } from '../store/treeUtils.js'

export function StageHeadersFlow() {
  const nodes = useTreeStore((s) => s.nodes)
  const edges = useTreeStore((s) => s.edges)
  const labels = useTreeStore((s) => s.stageColumnLabels)
  const setStageColumnLabel = useTreeStore((s) => s.setStageColumnLabel)

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

  return (
    <ViewportPortal>
      {/* Mapujemy po kolumnach, a nie po labels - to klucz do sukcesu! */}
      {columnXs.map((centerX, i) => {
        const text = labels[i] || ''; // Pobierz etykietę lub zostaw pustą

        return (
          <div
            key={i}
            className="pointer-events-auto"
            style={{
              position: 'absolute',
              transform: `translate(${centerX - headerWidth / 2}px, ${rowY}px)`,
              width: `${headerWidth}px`,
              zIndex: 10,
            }}
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setStageColumnLabel(i, e.target.value)}
              placeholder={i === columnXs.length - 1 ? "Konsekwencje" : `Etap ${i + 1}`}
              className="box-border h-8 w-full rounded border border-slate-400 bg-white/95 px-1.5 text-center text-[11px] font-semibold text-slate-800 shadow-sm outline-none backdrop-blur-sm placeholder:text-slate-400 focus-visible:border-slate-900 dark:border-slate-500 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-slate-300"
            />
          </div>
        )
      })}
    </ViewportPortal>
  )
}