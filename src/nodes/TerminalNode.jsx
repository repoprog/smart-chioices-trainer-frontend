import { Handle, Position } from '@xyflow/react'
import { NodeMenu } from '../components/NodeMenu.jsx'
import { useTreeStore } from '../store/useTreeStore.js'

const handleClass =
  '!h-2 !w-2 !min-h-0 !min-w-0 !border !border-slate-900 !bg-white !opacity-80'

export function TerminalNode({ id, data }) {
  const updateNodeData = useTreeStore((s) => s.updateNodeData);
  const isHighlighted = data?.isHighlighted;

  const handlePayoffChange = (e) => {
    updateNodeData(id, { payoff: e.target.value });
  };

  // --- LOGIKA SZANSY ---
  const pathProb = data?.pathProbability ?? 0;
  const probabilityPercent = (pathProb * 100).toFixed(1); 
  const isImpossible = pathProb === 0;
  
  const polygonClasses = isHighlighted ? 'fill-emerald-50 stroke-emerald-600' : 'fill-white stroke-[#0f172a]';
  const inputClasses = `w-28 rounded border bg-white px-2 py-1.5 font-sans text-xs font-bold tabular-nums outline-none shadow-sm transition-colors focus:ring-1 nodrag nopan pointer-events-auto ${
    isHighlighted
      ? 'border-emerald-400 bg-emerald-50 text-emerald-900 focus:border-emerald-500 focus:ring-emerald-500'
      : 'border-slate-300 text-slate-900 focus:border-sky-500 focus:ring-sky-500'
  }`;

  return (
    // Przywrócono sztywne 'h-11 items-center', aby input i trójkąt były idealnie w jednej osi
    <div className="group relative z-10 hover:!z-[9999] flex h-11 items-center transition-all">
      <Handle
        type="target"
        position={Position.Left}
        className={handleClass}
      />
      
      {/* 1. Perfekcyjny trójkąt SVG */}
      <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center drop-shadow-sm ${isHighlighted ? "highlighted" : ""}`}>
        <svg className="h-full w-full" viewBox="0 0 44 44">
          <polygon 
            points="2,2 42,22 2,42" 
            className={polygonClasses}
            strokeWidth="1.5" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {/* 2. Kontener na Input z absolutnie pozycjonowanym tekstem pod spodem */}
      <div className="ml-2 relative flex items-center">
        
        {/* Aktywne pole Input na wynik (payoff) */}
        <input
          type="text"
          value={data.payoff || ''}
          onChange={handlePayoffChange}
          placeholder="np. 120 000 zł"
          className={inputClasses}
        />

        {/* Prosty, subtelny tekst Szansy POD inputem */}
        <div className="absolute top-full left-1 mt-0.5 text-[10px] font-medium text-slate-500 whitespace-nowrap pointer-events-none">
          Szansa: <span className={isImpossible ? 'text-slate-400' : 'text-sky-600 font-bold'}>{probabilityPercent}%</span>
        </div>
      </div>

      {/* 3. Menu boczne */}
      <div
        className="absolute left-full top-1/2 pl-1 flex -translate-y-1/2 flex-col opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 pointer-events-none"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <NodeMenu nodeId={id} nodeType="terminal" hasIncoming={true} />
      </div>
    </div>
  )
}