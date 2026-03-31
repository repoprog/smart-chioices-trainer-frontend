import { Handle, Position } from '@xyflow/react'
import { useTreeStore } from '../store/useTreeStore.js'
import { NodeMenu } from '../components/NodeMenu.jsx'

const handleClass =
  '!h-2 !w-2 !min-h-0 !min-w-0 !border !border-slate-900 !bg-white !opacity-80'

const parseProbability = (p) => {
  if (p == null) return 0;
  return parseFloat(String(p).replace('%', '')) || 0;
};

export function ChanceNode({ id, data }) {
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
    // Zostawiamy tak jak miałeś: z-10 hover:!z-[9999]
    <div className="group relative z-10 hover:!z-[9999]">
      {isError && (
        <div 
          className="absolute -top-3 z-30 flex h-6 items-center justify-center whitespace-nowrap min-w-max rounded-full bg-red-500 px-2.5 text-[11px] font-bold text-white shadow-md ring-2 ring-white"
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

      {hasExpectedValue && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded-md bg-slate-900/50 backdrop-blur-sm">
          <span className="text-yellow-400 text-xs font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {Math.round(data.expectedValue).toLocaleString()}
          </span>
        </div>
      )}

      <div
        className="absolute left-full top-1/2 pl-1 flex -translate-y-1/2 flex-col opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 pointer-events-none"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <NodeMenu nodeId={id} nodeType="chance" hasIncoming={hasIncoming} />
      </div>
    </div>
  )
}
