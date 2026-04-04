import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getStraightPath } from "@xyflow/react";
import { useTreeStore } from "../store/useTreeStore.js";
import { FloatingToolbar } from "../components/FloatingToolbar.jsx";
import { useClipboardActions } from "../hooks/useClipboardActions.js";
const parseProbability = (p) => {
  if (p == null) return 0;
  return parseFloat(String(p).replace("%", "")) || 0;
};

export function SmartChoicesEdge({
  id, source, sourceX, sourceY, targetX, targetY, data, style,
}) {
  const nodes = useTreeStore((s) => s.nodes);
  const edges = useTreeStore((s) => s.edges);
  const updateEdgeData = useTreeStore((s) => s.updateEdgeData);
  const setEdgeProbability = useTreeStore((s) => s.setEdgeProbability);
  const toggleEdgeAutoBalance = useTreeStore((s) => s.toggleEdgeAutoBalance);

  const [isInteracting, setIsInteracting] = useState(false);

  const sourceNode = nodes.find((n) => n.id === source);
  const opt = data?.optionLabel ?? "";
  const cost = data?.cost ?? "";
  const displayProb = parseProbability(data?.probability);

  const globalShowCost = data?.showCost ?? false;
  const isHighlighted = data?.isHighlighted;
  const hasCostValue = cost !== "" && cost != null;

  const renderCostArea = globalShowCost || hasCostValue;
  const showFullInput = globalShowCost || isInteracting;

  const rawCost = String(cost);
  const numericCost = parseFloat(rawCost.replace(/zł|%|\s/g, '').replace(',', '.').replace('−', '-'));
  
  let costColorClass = "text-slate-100"; 
  if (numericCost > 0) costColorClass = "text-emerald-400";
  else if (numericCost < 0) costColorClass = "text-red-400"; 

 
const baseInputClassName = "nodrag nopan pointer-events-auto block w-[min(5.5rem,15vw)] max-w-[95px] rounded border border-transparent bg-transparent px-1.5 py-0.5 text-left font-sans text-[12px] font-medium leading-tight outline-none placeholder:text-slate-400 hover:border-slate-600 focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400 transition-colors";
  const handleProbChange = (e) => {
    const newProb = parseFloat(e.target.value);
    if (!isNaN(newProb)) setEdgeProbability(id, newProb);
  };

  const stepProbability = (step) => {
    const next = Math.max(0, Math.min(100, (isNaN(displayProb) ? 0 : displayProb) + step));
    setEdgeProbability(id, next);
  };

  const { executeCopy, executePaste, executeDelete } = useClipboardActions(id, true);

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

  const edgeStyle = {
    ...style,
    stroke: isHighlighted ? "#10b981" : "#06b6d4",
    strokeWidth: isHighlighted ? 2.5 : 1.15,
  };

  return (
    <>
      <BaseEdge id={id} path={path} style={edgeStyle} />
      <EdgeLabelRenderer>
        
        {/* ETYKIETA OPCJI */}
        <div
          className="nodrag nopan pointer-events-auto"
          style={{
            position: "absolute",
            transform: `translate(0, -100%) translate(${labelX_Start}px, ${labelY - 8}px)`,
            textAlign: "left",
            zIndex: 30, 
          }}
        >
          {/* Grupa optyzmalizowana (group/opt) */}
          <div className="relative flex items-center group/opt">
            <input
            
              className={`${baseInputClassName} text-sky-700 ${isHighlighted ? "border-emerald-400/60 !text-emerald-700" : ""}`}
              value={opt}
              onChange={(e) => updateEdgeData(id, { optionLabel: e.target.value })}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Opcja"
            />
            <div className="opacity-0 group-hover/opt:opacity-100 transition-opacity">
              <FloatingToolbar
                positionClass="bottom-full pb-1"
                title="opcję"
                onCopy={(e) => executeCopy(e, opt)}
                onPaste={(e) => executePaste(e, "optionLabel")}
                onDelete={(e) => executeDelete(e, "optionLabel")}
              />
            </div>
          </div>
        </div>

        {/* ETYKIETA KOSZTÓW */}
        {renderCostArea && (
          <div
            className="nodrag nopan pointer-events-auto"
            style={{
              position: "absolute",
              transform: `translate(0, 0%) translate(${labelX_Start}px, ${labelY + 8}px)`,
              textAlign: "left",
              zIndex: 30,
            }}
            onMouseEnter={() => setIsInteracting(true)}
            onMouseLeave={() => setIsInteracting(false)}
            onFocus={() => setIsInteracting(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setIsInteracting(false);
            }}
          >
            {showFullInput ? (
              <div className="relative flex items-center group/cost">
                <input
                  className={`${baseInputClassName} ${costColorClass}`}
                  value={cost}
                  onChange={(e) => updateEdgeData(id, { cost: e.target.value })}
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="np. -1000"
                  autoFocus={!globalShowCost}
                />
                <div className="opacity-0 group-hover/cost:opacity-100 transition-opacity">
                  <FloatingToolbar
                    positionClass="top-full pt-1"
                    title="koszt"
                    onCopy={(e) => executeCopy(e, cost)}
                    onPaste={(e) => executePaste(e, "cost")}
                    onDelete={(e) => executeDelete(e, "cost", () => setIsInteracting(false))}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setIsInteracting(true); }}
                onPointerDown={(e) => { e.stopPropagation(); setIsInteracting(true); }}
                title="Podejrzyj ukryty koszt"
                className="flex h-6 w-8 items-center justify-center rounded-full border border-slate-500 text-cyan-500 shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* ETYKIETA PRAWDOPODOBIEŃSTWA */}
        {sourceNode?.type === "chance" && (
          <div
            className="nodrag nopan pointer-events-auto"
            style={{
              position: "absolute",
              transform: `translate(-50%, 0) translate(${labelX_Center}px, ${labelY + 2}px)`,
              textAlign: "center",
              zIndex: 40, 
            }}
          >
            {/* Grupa wyizolowana dla samego prawdopodobieństwa */}
            <div className={`relative group/prob ${isHighlighted ? "highlighted" : ""}`}>
              <div className="flex items-center rounded border border-transparent bg-transparent px-1 py-0.5 hover:border-cyan-400 transition-colors">
                <input
                  type="number"
                  value={isNaN(displayProb) ? "" : displayProb}
                  onChange={handleProbChange}
                  className="w-9 bg-transparent text-right text-xs font-medium text-orange-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-slate-400 ml-0.5">%</span>
                {/* PRZYCISK AUTOREBALANCE ON/OFF */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleEdgeAutoBalance(id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`flex h-4 w-4 hide-on-export items-center justify-center rounded transition-colors ${
                    data?.isLocked 
                      ? " text-slate-400 hover:bg-red-500/20 hover:text-red-400" // Zablokowany (Ręczny)
                      : " text-cyan-400 hover:bg-cyan-500/40" // Auto
                  }`}
                  title={data?.isLocked ? "Autorebalance WYŁĄCZONY (kliknij, aby włączyć)" : "Autorebalance WŁĄCZONY (zablokuj wpisując wartość)"}
                >
                  {data?.isLocked ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  ) : (
                    <span className="text-[9px] font-bold">A</span>
                  )}
                </button>
                
              </div>

             {/* SLIDER */}
              <div className="absolute top-full left-1/2 pt-0.5 w-40 -translate-x-1/2 z-50 hidden group-hover/prob:block focus-within:block">
                <div className="flex items-center justify-between gap-1.5 rounded-md border border-cyan-500/60 bg-white/90 p-1.5 shadow-lg backdrop-blur-sm dark:bg-slate-900/50">
                  <button type="button" onClick={(e) => { e.stopPropagation(); stepProbability(-1); }} onPointerDown={(e) => e.stopPropagation()} className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-lg font-medium leading-none text-cyan-600 hover:bg-slate-200 hover:text-cyan-700 focus:outline-none dark:bg-slate-800 dark:text-cyan-400 dark:hover:bg-slate-700 dark:hover:text-cyan-300">-</button>
                  <input type="range" min="0" max="100" step="1" value={isNaN(displayProb) ? "0" : displayProb} onChange={handleProbChange} onPointerDown={(e) => e.stopPropagation()} className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-cyan-500 dark:bg-slate-700 dark:accent-cyan-500" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); stepProbability(1); }} onPointerDown={(e) => e.stopPropagation()} className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-lg font-medium leading-none text-cyan-600 hover:bg-slate-200 hover:text-cyan-700 focus:outline-none dark:bg-slate-800 dark:text-cyan-400 dark:hover:bg-slate-700 dark:hover:text-cyan-300">+</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}