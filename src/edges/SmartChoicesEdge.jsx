import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
} from '@xyflow/react';

import { useTreeStore } from '../store/useTreeStore.js';

const inputClassName =
  'nodrag nopan pointer-events-auto block w-[min(11rem,30vw)] max-w-[176px] rounded border border-cyan-500/60 bg-slate-950/75 px-1.5 py-0.5 text-center font-sans text-[11px] font-medium leading-tight text-slate-100 shadow-sm outline-none placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-cyan-400';

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
    // Dla prostej linii: start to sourceX, środek to średnia
    labelX_Start = sourceX;
    labelX_Center = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2;
  } else {
    const H_OFFSET = 20;
    path = `M ${sourceX} ${sourceY} L ${sourceX + H_OFFSET} ${targetY} L ${targetX} ${targetY}`;
    // Dla łamanej: start to początek poziomego odcinka, środek to środek poziomego odcinka
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
        {/* GÓRNA ETYKIETA - Wyrównana do lewej krawędzi */}
        <div
          className="nodrag nopan"
          style={{
            position: 'absolute',
            transform: `translate(0, -100%) translate(${labelX_Start}px, ${labelY - 4}px)`,
            textAlign: 'left',
          }}
        >
          <input
            className={inputClassName}
            value={opt}
            onChange={(e) => updateEdgeData(id, { optionLabel: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Opcja / zdarzenie"
            style={{ textAlign: 'left' }}
          />
        </div>

        {/* DOLNA ETYKIETA - Wycentrowana (tylko dla typu 'chance') */}
        {sourceNode?.type === 'chance' && (
          <div
            className="nodrag nopan group pointer-events-auto"
            style={{
              position: 'absolute',
              transform: `translate(-50%, 0%) translate(${labelX_Center}px, ${labelY + 4}px)`,
              textAlign: 'center',
            }}
          >
            <div className="relative">
              <div className="flex items-center">
                <input
                  type="number"
                  value={isNaN(displayProb) ? '' : displayProb}
                  onChange={handleProbChange}
                  className="w-12 rounded border border-cyan-500/60 bg-slate-950/75 px-1 py-0.5 text-center text-xs font-medium text-slate-100 shadow-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="pl-1 text-xs text-cyan-400">%</span>
              </div>
              
              {/* ZWRÓCONY SUWAK RANGE - Dodałem klasy: hidden group-hover:block */}
              <div className="absolute top-full left-1/2 mt-1 w-32 -translate-x-1/2 z-50 hidden group-hover:block">
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