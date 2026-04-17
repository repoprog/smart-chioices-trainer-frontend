import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { useTreeStore } from '../../store/useTreeStore.js';
import { NodeMenu } from '../NodeMenu.jsx';
import { NodeEquationBadge } from './NodeEquationBadge.jsx'; 

const handleClass = '!h-2 !w-2 !min-h-0 !min-w-0 !border !border-slate-900 !bg-white !opacity-80';

export function DecisionNode({ id, data }) {
  const edges = useTreeStore((s) => s.edges);
  const hasIncoming = edges.some((e) => e.target === id);
  const isHighlighted = data?.isHighlighted;

  const nodeClasses = `flex h-11 w-11 items-center justify-center rounded-sm border shadow-sm transition-colors ${
    isHighlighted ? 'border-emerald-500 bg-emerald-50 font-bold ring-4 ring-emerald-500/30' : 'border-slate-900 bg-white'
  }`;

  const spanClasses = `font-sans text-sm font-semibold tabular-nums ${
    isHighlighted ? 'text-emerald-800' : 'text-slate-900'
  }`;

  const hasExpectedValue = typeof data.expectedValue === 'number';

  return (
    <div className="relative z-10 hover:!z-[9999]">
      <div className="group/node relative h-11 w-11">
        <div className={nodeClasses}>
          <span className={spanClasses}>
            {data.nodeNumber}
          </span>
          <Handle type="target" position={Position.Left} className={handleClass} />
          <Handle type="source" position={Position.Right} className={handleClass} />
        </div>

        {/* CORE MECHANIC: Node action menu triggered on hover */}
        <div className="absolute left-full top-1/2 pl-1 flex -translate-y-1/2 flex-col opacity-0 group-hover/node:pointer-events-auto group-hover/node:opacity-100 pointer-events-none z-[1000]">
          <NodeMenu nodeId={id} nodeType="decision" hasIncoming={hasIncoming} />
        </div>
      </div>

      {hasExpectedValue && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 flex justify-center">
           <div className="relative flex items-center justify-center">
             
             <NodeEquationBadge equation={data.equation} symbol="ƒ" />

             <div className="px-2 py-0.5 rounded-md bg-slate-900/50 backdrop-blur-sm shadow-inner pointer-events-none">
               <span className="text-yellow-400 text-xs font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {data.expectedValue.toLocaleString('pl-PL', { maximumFractionDigits: 2 })}
               </span>
             </div>

           </div>
        </div>
      )}
    </div>
  );
}