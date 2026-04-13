import { Handle, Position } from '@xyflow/react'
import { NodeMenu } from '../NodeMenu.jsx'
import { useTreeStore } from '../../store/useTreeStore.js'
import { FloatingToolbar } from '../../../../components/ui/FloatingToolbar.jsx'
import { useClipboardActions } from '../../../../hooks/useClipboardActions.js'

const handleClass = '!h-2 !w-2 !min-h-0 !min-w-0 !border !border-slate-900 !bg-white !opacity-80'

export function TerminalNode({ id, data }) {
  const updateNodeData = useTreeStore((s) => s.updateNodeData);
  const isHighlighted = data?.isHighlighted;

  const handlePayoffChange = (e) => {
    updateNodeData(id, { payoff: e.target.value });
  };

  const { executeCopy, executePaste, executeDelete } = useClipboardActions(id, false);

  const pathProb = data?.pathProbability ?? 0;
  const probabilityPercent = (pathProb * 100).toFixed(1); 
  const isImpossible = pathProb === 0;
  
  
  const fillColor = isHighlighted ? '#ecfdf5' : '#ffffff'; // emerald-50 : white
  const strokeColor = isHighlighted ? '#10b981' : '#0f172a'; // emerald-600 : slate-900

  
  const rawPayoff = String(data.payoff || '');
  const numericPayoff = parseFloat(rawPayoff.replace(/zł|%|\s/g, '').replace(',', '.').replace('−', '-'));
  
  let textColorClass = 'text-slate-900'; 
  if (numericPayoff > 0) {
    textColorClass = 'text-emerald-600'; 
  } else if (numericPayoff < 0) {
    textColorClass = 'text-red-600'; 
  }

  const inputClasses = `w-28 rounded border bg-white px-2 py-1.5 font-sans text-xs font-bold tabular-nums outline-none shadow-sm transition-colors focus:ring-1 nodrag nopan pointer-events-auto ${
    isHighlighted
      ? `border-emerald-400 bg-emerald-50 focus:border-emerald-500 focus:ring-emerald-500 ${isNaN(numericPayoff) || numericPayoff === 0 ? 'text-emerald-900' : textColorClass}`
      : `border-slate-300 focus:border-sky-500 focus:ring-sky-500 ${textColorClass}`
  }`;

  return (
    // PANCERZ + Wyizolowana grupa głowna (group/node)
    <div className="group/node relative z-10 hover:!z-[9999] flex h-11 items-center transition-all">
      <Handle type="target" position={Position.Left} className={handleClass} />
      
      <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center drop-shadow-sm ${isHighlighted ? "highlighted" : ""}`}>
        <svg className="h-full w-full" viewBox="0 0 44 44">
          <polygon 
            points="2,2 42,22 2,42" 
            // --- POPRAWKA TUTAJ ---
            // Wpisujemy kolory bezpośrednio w atrybuty natywne SVG
            fill={fillColor}
            stroke={strokeColor}
            // Zmieniono strokeWidth z 1.5 na 1, żeby pasowało do Tailwinda 'border'
            strokeWidth="1" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      <div className="ml-2 relative flex flex-col justify-center">
        
        {/* GRUPA WEWNĘTRZNA DLA INPUTA (group/input) - zapobiega konfliktom z głównym menu */}
        <div className="relative flex items-center group/input">
          <input
            type="text"
            value={data.payoff || ''}
            onChange={handlePayoffChange}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="np. 120 000 zł"
            className={inputClasses}
          />
          <div className="opacity-0 group-hover/input:opacity-100 transition-opacity">
            <FloatingToolbar
              positionClass="bottom-full pb-1"
              title="wynik"
              onCopy={(e) => executeCopy(e, data.payoff)}
              onPaste={(e) => executePaste(e, "payoff")}
              onDelete={(e) => executeDelete(e, "payoff")}
            />
          </div>
        </div>

        <div className="absolute top-full left-1 mt-0.5 text-[10px] font-medium text-slate-500 whitespace-nowrap pointer-events-none">
          Szansa: <span className={isImpossible ? 'text-slate-400' : 'text-sky-600 font-bold'}>{probabilityPercent}%</span>
        </div>
      </div>

      {/* MENU WĘZŁA: Reaguje na group/node. Bez animacji opacity. */}
      <div
        className="absolute left-full top-1/2 pl-1 flex -translate-y-1/2 flex-col opacity-0 group-hover/node:pointer-events-auto group-hover/node:opacity-100 pointer-events-none z-[1000]"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <NodeMenu nodeId={id} nodeType="terminal" hasIncoming={true} />
      </div>
    </div>
  )
}