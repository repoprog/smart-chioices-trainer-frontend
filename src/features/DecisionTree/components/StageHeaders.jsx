import { useMemo } from 'react'
import { ViewportPortal } from '@xyflow/react'
import { ArrowUp, ArrowDown } from 'lucide-react';

import { useTreeStore } from '../store/useTreeStore.js'
import { computeStageHeaderRowY, getUniqueColumnXs } from '../logic/treeUtils.js'
import { Button } from '../../../components/ui/Button'; 

export function StageHeaders() {
  const nodes = useTreeStore((s) => s.nodes)
  const edges = useTreeStore((s) => s.edges);
  const labels = useTreeStore((s) => s.stageColumnLabels)
  const setStageColumnLabel = useTreeStore((s) => s.setStageColumnLabel)
  const evaluationMode = useTreeStore((s) => s.evaluationMode);
  const setEvaluationMode = useTreeStore((s) => s.setEvaluationMode);

  const rowY = useMemo(() => computeStageHeaderRowY(nodes), [nodes])


  const columnXs = useMemo(() => {
    return getUniqueColumnXs(nodes, edges).map(x => x + 22);
  }, [nodes, edges]);

  if (!columnXs.length) return null

  const headerWidth = 160;

  const handleToggleMode = () => {
    setEvaluationMode(evaluationMode === 'max' ? 'min' : 'max');
  }

  return (
    <ViewportPortal>
     
      {columnXs.map((centerX, i) => {
        const text = labels[i] || ''; 
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
                <Button
                  variant="emeraldOutline"
                  onClick={handleToggleMode}
                  title={evaluationMode === 'max' ? 'Zmień na poszukiwanie minimum (np. kosztów)' : 'Zmień na poszukiwanie maksimum (np. zysków)'}
                  className="absolute -right-2 top-1/2 h-8 -translate-y-1/2 translate-x-full gap-1.5 whitespace-nowrap rounded px-3 text-[11px] font-semibold"
                >
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {evaluationMode === 'max' ? (
                      <ArrowUp className="w-4 h-4 stroke-[2.5px]" /> 
                    ) : (
                      <ArrowDown className="w-4 h-4 stroke-[2.5px]" />
                    )}
                  </span>
                  <span>
                    {evaluationMode === 'max' ? 'Lepiej [Max]' : 'Lepiej [Min]'}
                  </span>
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </ViewportPortal>
  )
}