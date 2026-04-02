import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getStraightPath } from "@xyflow/react";

import { useTreeStore } from "../store/useTreeStore.js";

const inputClassName =
  "nodrag nopan pointer-events-auto block w-[min(5.5rem,15vw)] max-w-[88px] rounded border border-transparent bg-slate-950/75 px-1.5 py-0.5 text-center font-sans text-[11px] font-medium leading-tight text-slate-100 shadow-sm outline-none placeholder:text-slate-500 hover:border-slate-600 focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400 transition-colors";

const parseProbability = (p) => {
  if (p == null) return 0;
  return parseFloat(String(p).replace("%", "")) || 0;
};

// --- REFAKTORYZACJA: UNIWERSALNY KOMPONENT TOOLBARA ---
const FloatingToolbar = ({
  positionClass,
  title,
  onCopy,
  onPaste,
  onDelete,
}) => (
  <div
    className={`absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${positionClass}`}
  >
    <button
      onClick={onCopy}
      onPointerDown={(e) => e.stopPropagation()}
      title={`Kopiuj ${title}`}
      className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-cyan-400 transition-colors shadow-sm"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
    <button
      onClick={onPaste}
      onPointerDown={(e) => e.stopPropagation()}
      title={`Wklej ${title}`}
      className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-emerald-400 transition-colors shadow-sm"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    </button>
    <button
      onClick={onDelete}
      onPointerDown={(e) => e.stopPropagation()}
      title={`Usuń ${title}`}
      className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-colors shadow-sm"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </button>
  </div>
);

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

  // --- REFAKTORYZACJA: UNIWERSALNE FUNKCJE LOGICZNE ---
  const handleProbChange = (e) => {
    const newProb = parseFloat(e.target.value);
    if (!isNaN(newProb)) setEdgeProbability(id, newProb);
  };

  const stepProbability = (step) => {
    const next = Math.max(
      0,
      Math.min(100, (isNaN(displayProb) ? 0 : displayProb) + step),
    );
    setEdgeProbability(id, next);
  };

  const executeCopy = (e, value) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value).catch(() => alert("Wymagane HTTPS."));
  };

  const executePaste = async (e, key) => {
    e.stopPropagation();
    try {
      const text = await navigator.clipboard.readText();
      if (text) updateEdgeData(id, { [key]: text });
    } catch {
      alert("Wymagane HTTPS i zgoda na schowek.");
    }
  };

  const executeDelete = (e, key, callback) => {
    e.stopPropagation();
    updateEdgeData(id, { [key]: "" });
    if (callback) callback();
  };

  // --- OBLICZANIE ŚCIEŻKI ---
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
        {/* GÓRNA ETYKIETA - Opcja */}
        <div
          className="nodrag nopan pointer-events-auto"
          style={{
            position: "absolute",
            transform: `translate(0, -100%) translate(${labelX_Start}px, ${labelY - 8}px)`,
            textAlign: "left",
          }}
        >
          <div className="relative flex items-center group">
            <input
              className={`${inputClassName} ${isHighlighted ? "border-emerald-400/60 text-emerald-100" : ""}`}
              value={opt}
              onChange={(e) =>
                updateEdgeData(id, { optionLabel: e.target.value })
              }
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Opcja"
            />
            {/* Użycie zrefaktoryzowanego Toolbara */}
            <FloatingToolbar
              positionClass="bottom-full pb-1"
              title="opcję"
              onCopy={(e) => executeCopy(e, opt)}
              onPaste={(e) => executePaste(e, "optionLabel")}
              onDelete={(e) => executeDelete(e, "optionLabel")}
            />
          </div>
        </div>

        {/* DOLNA ETYKIETA KOSZTÓW */}
        {renderCostArea && (
          <div
            className="nodrag nopan pointer-events-auto"
            style={{
              position: "absolute",
              transform: `translate(0, 0%) translate(${labelX_Start}px, ${labelY + 8}px)`,
              textAlign: "left",
            }}
            onMouseEnter={() => setIsInteracting(true)}
            onMouseLeave={() => setIsInteracting(false)}
            onFocus={() => setIsInteracting(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget))
                setIsInteracting(false);
            }}
          >
            {showFullInput ? (
              <div className="relative flex items-center group">
                <input
                  className={inputClassName} // reużywamy tej samej klasy co wyżej!
                  value={cost}
                  onChange={(e) => updateEdgeData(id, { cost: e.target.value })}
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="np. -1000"
                  autoFocus={!globalShowCost}
                />
                {/* Użycie zrefaktoryzowanego Toolbara */}
                <FloatingToolbar
                  positionClass="top-full pt-1"
                  title="koszt"
                  onCopy={(e) => executeCopy(e, cost)}
                  onPaste={(e) => executePaste(e, "cost")}
                  onDelete={(e) =>
                    executeDelete(e, "cost", () => setIsInteracting(false))
                  }
                />
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInteracting(true);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsInteracting(true);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setIsInteracting(true);
                }}
                title="Podejrzyj ukryty koszt"
                className="flex h-6 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-cyan-500 shadow-sm"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* ŚRODKOWA ETYKIETA - Prawdopodobieństwo */}
        {sourceNode?.type === "chance" && (
          <div
            className="nodrag nopan group pointer-events-auto"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX_Center}px, ${labelY}px)`,
              textAlign: "center",
            }}
          >
            <div className={`relative ${isHighlighted ? "highlighted" : ""}`}>
              <div className="flex items-center rounded border border-cyan-500/60 bg-slate-950 px-1 py-0.5 shadow-sm hover:border-cyan-400 transition-colors">
                <input
                  type="number"
                  value={isNaN(displayProb) ? "" : displayProb}
                  onChange={handleProbChange}
                  className="w-9 bg-transparent text-center text-xs font-medium text-slate-100 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="pr-1 text-xs text-cyan-400">%</span>
              </div>

              <div className="absolute top-full left-1/2 pt-1.5 w-40 -translate-x-1/2 z-50 hidden group-hover:block focus-within:block">
                <div className="flex items-center justify-between gap-1.5 rounded-md border border-cyan-500/60 bg-slate-900/95 p-1.5 shadow-lg backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      stepProbability(-1);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-800 text-lg font-medium leading-none text-cyan-400 hover:bg-slate-700 hover:text-cyan-300 focus:outline-none"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={isNaN(displayProb) ? "0" : displayProb}
                    onChange={handleProbChange}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      stepProbability(1);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-800 text-lg font-medium leading-none text-cyan-400 hover:bg-slate-700 hover:text-cyan-300 focus:outline-none"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
