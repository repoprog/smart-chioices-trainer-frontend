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
  
  const outgoingEdges = edges.filter((e) => e.source === id)
  const hasChildren = outgoingEdges.length > 0
  const hasIncoming = edges.some((e) => e.target === id)

  const probSum = outgoingEdges.reduce((sum, e) => sum + parseProbability(e.data?.probability), 0);
  const isError = hasChildren && Math.abs(probSum - 100) > 0.1;

  return (
    // KLUCZOWE: Dodano z-10 i hover:!z-[9999] tutaj!
    <div className="group relative z-10 hover:!z-[9999]">
      {isError && (
        <div 
          className="absolute -right-3 -top-3 z-30 flex h-6 items-center justify-center whitespace-nowrap min-w-max rounded-full bg-red-500 px-2.5 text-[11px] font-bold text-white shadow-md ring-2 ring-white"
          title="Suma prawdopodobieństw musi wynosić dokładnie 100%"
        >
          ⚠️ {Math.round(probSum)}%
        </div>
      )}

      <div 
        className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-colors ${
          isError ? 'border-red-500 ring-4 ring-red-500/30 bg-red-50 text-red-700' : 'border-slate-900 bg-white text-slate-900'
        }`}
      >
        <span className="font-sans text-sm font-semibold tabular-nums">
          {data.nodeNumber}
        </span>
        <Handle type="target" position={Position.Left} className={handleClass} />
        <Handle type="source" position={Position.Right} className={handleClass} />
      </div>

      <div
        className="absolute left-full top-1/2 !z-[9999] pl-2 flex -translate-y-1/2 flex-col opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 pointer-events-none"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <NodeMenu nodeId={id} nodeType="chance" hasIncoming={hasIncoming} />
      </div>
    </div>
  )
}