import { Handle, Position } from '@xyflow/react'
import { useTreeStore } from '../store/useTreeStore.js'
import { NodeMenu } from '../components/NodeMenu.jsx'

const handleClass =
  '!h-2 !w-2 !min-h-0 !min-w-0 !border !border-slate-900 !bg-white !opacity-80'

export function DecisionNode({ id, data }) {
  const edges = useTreeStore((s) => s.edges)
  const hasIncoming = edges.some((e) => e.target === id)

  return (
    // DODANO: z-10 hover:!z-[9999] tak jak w pozostałych
    <div className="group relative z-10 hover:!z-[9999]">
      <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-slate-900 bg-white shadow-sm">
        <span className="font-sans text-sm font-semibold tabular-nums text-slate-900">
          {data.nodeNumber}
        </span>
        <Handle type="target" position={Position.Left} className={handleClass} />
        <Handle type="source" position={Position.Right} className={handleClass} />
      </div>

      <div
        className="absolute left-full top-1/2 pl-1 flex -translate-y-1/2 flex-col opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 pointer-events-none"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <NodeMenu nodeId={id} nodeType="decision" hasIncoming={hasIncoming} />
      </div>
    </div>
  )
}