import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useTreeStore } from '../../store/useTreeStore.js'
import { NodeMenu } from '../NodeMenu.jsx'

const handleClass = '!h-2 !w-2 !min-h-0 !min-w-0 !border !border-slate-900 !bg-white !opacity-80'

const parseProbability = (p) => {
  if (p == null) return 0;
  return parseFloat(String(p).replace('%', '')) || 0;
};

export function ChanceNode({ id, data }) {
  const [isPinned, setIsPinned] = useState(false); 
  
  const edges = useTreeStore((s) => s.edges)
  const isHighlighted = data?.isHighlighted;
  
  const outgoingEdges = edges.filter((e) => e.source === id)
  const hasChildren = outgoingEdges.length > 0
  const hasIncoming = edges.some((e) => e.target === id)

  const probSum = outgoingEdges.reduce((sum, e) => sum + parseProbability(e.data?.probability), 0);
  const isError = hasChildren && Math.abs(probSum - 100) > 0.1;

  let classes = 'flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-colors ';
  if (isHighlighted) {
    classes += 'border-emerald-500 bg-emerald-50 font-bold ring-4 ring-emerald-500/30 text-emerald-800';
  } else if (isError) {
    classes += 'border-red-500 ring-4 ring-red-500/30 bg-red-50 text-red-700';
  } else {
    classes += 'border-slate-900 bg-white text-slate-900';
  }
  
  const hasExpectedValue = typeof data.expectedValue === 'number';

  return (
    <div className="relative z-10 hover:!z-[9999]">
      <div className="group/node relative h-11 w-11">
        
        {isError && (
          <div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex h-6 items-center justify-center whitespace-nowrap min-w-max rounded-full bg-red-500 px-2.5 text-[11px] font-bold text-white shadow-md ring-2 ring-white"
            title="Suma prawdopodobieństw musi wynosić dokładnie 100%"
          >
             {Math.round(probSum)}%
          </div>
        )}

        <div className={classes}>
          <span className="font-sans text-sm font-semibold tabular-nums">
            {data.nodeNumber}
          </span>
          <Handle type="target" position={Position.Left} className={handleClass} />
          <Handle type="source" position={Position.Right} className={handleClass} />
        </div>

        {/* MENU WĘZŁA: Usunięto animację przejścia. Znika natychmiastowo. */}
        <div
          className="absolute left-full top-1/2 pl-1 flex -translate-y-1/2 flex-col opacity-0 group-hover/node:pointer-events-auto group-hover/node:opacity-100 pointer-events-none z-[1000]"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <NodeMenu nodeId={id} nodeType="chance" hasIncoming={hasIncoming} />
        </div>
      </div>

      {hasExpectedValue && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 flex justify-center">
           <div className="relative flex items-center justify-center">
             
             {data.equation && (
               <div className="absolute right-full mr-1.5 flex items-center group/eq">
                  <div 
                    className="nodrag nopan relative z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPinned(!isPinned);
                    }}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold transition-colors ${
                      isPinned ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-200/80 text-slate-600 group-hover/eq:bg-slate-300'
                    }`}>
                      ∑
                    </div>
                  </div>
                  
                  <div className={`pointer-events-none absolute top-full left-1/2 z-[10000] mt-0.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-300 bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 shadow-xl transition-all duration-200 ${
                    isPinned ? 'opacity-100 -translate-y-0.5' : 'opacity-0 translate-y-0 group-hover/eq:opacity-100 group-hover/eq:-translate-y-0.5'
                  }`}>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-300"></div>
                    <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
                    {data.equation}
                  </div>
               </div>
             )}

             <div className="px-2 py-0.5 rounded-md bg-slate-900/50 backdrop-blur-sm shadow-inner pointer-events-none">
               <span className="text-yellow-400 text-xs font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {data.expectedValue.toLocaleString('pl-PL', { maximumFractionDigits: 2 })}
               </span>
             </div>

           </div>
        </div>
      )}
    </div>
  )
}