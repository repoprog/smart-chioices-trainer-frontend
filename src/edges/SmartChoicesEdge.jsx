import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
} from '@xyflow/react';

import { useTreeStore } from '../store/useTreeStore.js';

// Zmieniono max-w-[176px] na max-w-[88px] oraz 11rem na 5.5rem
const inputClassName =
  'nodrag nopan pointer-events-auto block w-[min(5.5rem,15vw)] max-w-[88px] rounded border border-cyan-500/60 bg-slate-950/75 px-1.5 py-0.5 text-center font-sans text-[11px] font-medium leading-tight text-slate-100 shadow-sm outline-none placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-cyan-400';

const costInputClassName = 
  'nodrag nopan pointer-events-auto block w-[min(5.5rem,15vw)] max-w-[88px] rounded border border-emerald-500/60 bg-slate-950/75 px-1.5 py-0.5 text-center font-sans text-[11px] font-medium leading-tight text-emerald-100 shadow-sm outline-none placeholder:text-emerald-500/60 focus-visible:ring-1 focus-visible:ring-emerald-400';

const parseProbability = (p) => {
  if (p == null) return 0;
  return parseFloat(String(p).replace('%', '')) || 0;
};

export function SmartChoicesEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
}) {
  const nodes = useTreeStore((s) => s.nodes);
  const edges = useTreeStore((s) => s.edges);
  const updateEdgeData = useTreeStore((s) => s.updateEdgeData);
  const setEdgeProbability = useTreeStore((s) => s.setEdgeProbability);

  const sourceNode = nodes.find((n) => n.id === source);
  const opt = data?.optionLabel ?? '';
  const displayProb = parseProbability(data?.probability);
  const cost = data?.cost ?? ''; 
  const showCost = data?.showCost ?? false; 

  const handleProbChange = (e) => {
    const newProb = parseFloat(e.target.value);
    if (!isNaN(newProb)) {
      setEdgeProbability(id, newProb);
    }
  };

  const siblingEdges = edges.filter((e) => e.source === source);

  let path, labelX_Start, labelX_Center, labelY;

  if (siblingEdges.length <= 1) {
    [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
    labelX_Start = sourceX;
    labelX_Center = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2;
  } else {
    const H_OFFSET = 20;
    path = `M ${sourceX} ${sourceY} L ${sourceX + H_OFFSET} ${targetY} L ${targetX} ${targetY}`;
    labelX_Start = sourceX + H_OFFSET;
    labelX_Center = (sourceX + H_OFFSET + targetX) / 2;
    labelY = targetY;
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{ stroke: '#0ff', strokeWidth: 1.15, ...style }}
      />
      <EdgeLabelRenderer>
        {/* GÓRNA ETYKIETA - Opcja (Nad linią) */}
        <div
          className="nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(0, -100%) translate(${labelX_Start}px, ${labelY - 8}px)`,
            textAlign: 'left',
          }}
        >
          <input
            className={inputClassName}
            value={opt}
            onChange={(e) => updateEdgeData(id, { optionLabel: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Opcja"
            style={{ textAlign: 'left' }}
          />
        </div>

        {/* NOWA ETYKIETA KOSZTÓW - (Pod linią) */}
        {showCost && (
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(0, 0%) translate(${labelX_Start}px, ${labelY + 8}px)`,
              textAlign: 'left',
            }}
          >
            <input
              className={costInputClassName}
              value={cost}
              onChange={(e) => updateEdgeData(id, { cost: e.target.value })}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="np. -1000"
              style={{ textAlign: 'left' }}
            />
          </div>
        )}

        {/* ŚRODKOWA ETYKIETA - Prawdopodobieństwo (tylko dla typu 'chance') */}
        {sourceNode?.type === 'chance' && (
          <div
            className="nodrag nopan group pointer-events-auto"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX_Center}px, ${labelY}px)`,
              textAlign: 'center',
              zIndex: 10,
            }}
          >
            <div className="relative">
              <div className="flex items-center rounded border border-cyan-500/60 bg-slate-950 px-1 py-0.5 shadow-sm">
                <input
                  type="number"
                  value={isNaN(displayProb) ? '' : displayProb}
                  onChange={handleProbChange}
                  className="w-9 bg-transparent text-center text-xs font-medium text-slate-100 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="pr-1 text-xs text-cyan-400">%</span>
              </div>
              
              {/* SUWAK RANGE */}
              {/* Zmieniono mt-2 na mt-0.5, aby przybliżyć suwak */}
              <div className="absolute top-full left-1/2 mt-0.5 w-32 -translate-x-1/2 z-50 hidden group-hover:block">
                <div className="rounded-md border border-cyan-500/60 bg-slate-900/90 p-2 shadow-lg backdrop-blur-sm">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={isNaN(displayProb) ? '0' : displayProb}
                    onChange={handleProbChange}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}