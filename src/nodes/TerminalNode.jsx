import { Handle, Position } from '@xyflow/react'
import { NodeMenu } from '../components/NodeMenu.jsx'
import { useTreeStore } from '../store/useTreeStore.js'

const handleClass =
  '!h-2 !w-2 !min-h-0 !min-w-0 !border !border-slate-900 !bg-white !opacity-80'

export function TerminalNode({ id, data }) {
  const updateNodeData = useTreeStore((s) => s.updateNodeData);

  const handlePayoffChange = (e) => {
    updateNodeData(id, { payoff: e.target.value });
  };

  return (
    // Główny kontener dba o wywindowanie na wierzch przy hoverze:
    <div className="group relative z-10 hover:!z-[9999] flex h-11 items-center transition-all">
      <Handle
        type="target"
        position={Position.Left}
        className={handleClass}
      />
      
      {/* 1. Perfekcyjny trójkąt SVG */}
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center drop-shadow-sm">
        <svg className="h-full w-full" viewBox="0 0 44 44">
          <polygon 
            points="2,2 42,22 2,42" 
            fill="white" 
            stroke="#0f172a"
            strokeWidth="1.5" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {/* 2. Aktywne pole Input na wynik (payoff) */}
      <div className="ml-2 flex items-center">
        <input
          type="text"
          value={data.payoff || ''}
          onChange={handlePayoffChange}
          placeholder="np. 120 000 zł"
          className="w-28 rounded border border-slate-300 bg-white px-2 py-1.5 font-sans text-xs font-bold tabular-nums text-slate-900 outline-none shadow-sm transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 nodrag nopan pointer-events-auto"
        />
      </div>

      {/* 3. Menu (usunięto stąd zbędne !z-[9999], bo rodzic to ogarnia) */}
      <div
        className="absolute left-full top-1/2 pl-1 flex -translate-y-1/2 flex-col opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 pointer-events-none"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <NodeMenu nodeId={id} nodeType="terminal" hasIncoming={true} />
      </div>
    </div>
  )
}