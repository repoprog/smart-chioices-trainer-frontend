import React, { useState } from "react";
import { useTableStore } from '../store/useTableStore';
import { getTradeoffResults, getRowRanks } from "../logic/tableLogic"; // Ścieżka do starej logiki (na razie)
import { Eye, EyeOff } from 'lucide-react';

import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { TableConclusions } from "./TableConclusions";

export function TableGrid() {
  const store = useTableStore();
  const [focusedCell, setFocusedCell] = useState(null);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const {
    alternatives, objectives, cells, objectiveUnits, showRanking, sortDirections,
    showTradeoffs, originalCells, hideEqualizedObjectives, rejectedAlternatives, showRejected,
    toggleShowRejected, toggleHideEqualized, toggleSortDirection,
    addAlternative, addObjective, updateAlternative, updateObjective, updateCell, updateUnit,
    rejectAlternative, restoreAlternative,
  } = store;

  const {
    equalizedRowsIndexes, equalizedCount, dominationResults,
    winnerIndex, completeAlts,
  } = getTradeoffResults(store);

  const closeConfirmModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  const executeRemoveAlt = (indexToRemove) => {
    useTableStore.setState((state) => {
      const newAlternatives = state.alternatives.filter((_, index) => index !== indexToRemove);
      const newCells = {};
      for (let r = 0; r < state.objectives.length; r++) {
        for (let c = 0; c < state.alternatives.length; c++) {
          if (c === indexToRemove) continue;
          const newC = c > indexToRemove ? c - 1 : c;
          if (state.cells[`${r}-${c}`] !== undefined) newCells[`${r}-${newC}`] = state.cells[`${r}-${c}`];
        }
      }
      return {
        alternatives: newAlternatives,
        cells: newCells,
        rejectedAlternatives: state.rejectedAlternatives.filter((c) => c !== indexToRemove).map((c) => (c > indexToRemove ? c - 1 : c)),
      };
    });
  };

  const handleRemoveAlternative = (indexToRemove) => {
    const hasData = objectives.some((_, r) => cells[`${r}-${indexToRemove}`] && cells[`${r}-${indexToRemove}`].toString().trim() !== "");
    if (hasData) {
      setModalConfig({
        isOpen: true,
        title: "Usuwanie alternatywy",
        message: `Alternatywa "${alternatives[indexToRemove]}" zawiera wpisane dane. Czy na pewno chcesz ją usunąć?`,
        onConfirm: () => executeRemoveAlt(indexToRemove),
      });
    } else {
      executeRemoveAlt(indexToRemove);
    }
  };

  const executeRemoveObj = (indexToRemove) => {
    useTableStore.setState((state) => {
      const newObjectives = state.objectives.filter((_, index) => index !== indexToRemove);
      const newCells = {};
      for (let r = 0; r < state.objectives.length; r++) {
        if (r === indexToRemove) continue;
        const newR = r > indexToRemove ? r - 1 : r;
        for (let c = 0; c < state.alternatives.length; c++) {
          if (state.cells[`${r}-${c}`] !== undefined) newCells[`${newR}-${c}`] = state.cells[`${r}-${c}`];
        }
      }
      const newSortDirections = {};
      Object.keys(state.sortDirections).forEach((key) => {
        const k = parseInt(key);
        if (k === indexToRemove) return;
        const newK = k > indexToRemove ? k - 1 : k;
        newSortDirections[newK] = state.sortDirections[k];
      });
      const newObjectiveUnits = {};
      Object.keys(state.objectiveUnits).forEach((key) => {
        const k = parseInt(key);
        if (k === indexToRemove) return;
        const newK = k > indexToRemove ? k - 1 : k;
        newObjectiveUnits[newK] = state.objectiveUnits[k];
      });
      return {
        objectives: newObjectives,
        cells: newCells,
        sortDirections: newSortDirections,
        objectiveUnits: newObjectiveUnits,
      };
    });
  };

  const handleRemoveObjective = (indexToRemove) => {
    const hasData = alternatives.some((_, c) => cells[`${indexToRemove}-${c}`] && cells[`${indexToRemove}-${c}`].toString().trim() !== "");
    if (hasData) {
      setModalConfig({
        isOpen: true,
        title: "Usuwanie celu",
        message: `Cel "${objectives[indexToRemove]}" zawiera wpisane dane. Czy na pewno chcesz go usunąć?`,
        onConfirm: () => executeRemoveObj(indexToRemove),
      });
    } else {
      executeRemoveObj(indexToRemove);
    }
  };

  return (
    <div className="w-full pb-6">
      <div className={`relative isolate rounded-xl transition-all duration-500 border border-border bg-card shadow-sm overflow-hidden ${showTradeoffs ? "ring-2 ring-purple-500 z-20 shadow-[0_0_20px_rgba(168,85,247,0.3)]" : ""}`}>
        <div className="overflow-x-auto w-full">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              <col className="w-[300px] md:w-[360px]" />
              {alternatives.map((_, i) => (
                <col key={i} className={`min-w-[150px] ${rejectedAlternatives.includes(i) && !showRejected ? "hidden" : ""}`} />
              ))}
            </colgroup>

            <TableHeader
              objectives={objectives}
              alternatives={alternatives}
              showRanking={showRanking}
              dominationResults={dominationResults}
              rejectedAlternatives={rejectedAlternatives}
              showRejected={showRejected}
              winnerIndex={winnerIndex}
              addObjective={addObjective}
              addAlternative={addAlternative}
              updateAlternative={updateAlternative}
              onRemoveAlternative={handleRemoveAlternative}
            />

            <tbody>
              {objectives.map((objName, rowIndex) => (
                <TableRow
                  key={`row-${rowIndex}`}
                  rowIndex={rowIndex}
                  objName={objName}
                  alternatives={alternatives}
                  cells={cells}
                  objectiveUnits={objectiveUnits}
                  showRanking={showRanking}
                  sortDirections={sortDirections}
                  showTradeoffs={showTradeoffs}
                  originalCells={originalCells}
                  hideEqualizedObjectives={hideEqualizedObjectives}
                  rejectedAlternatives={rejectedAlternatives}
                  showRejected={showRejected}
                  rowRanks={getRowRanks(rowIndex, store)}
                  isRowEqual={equalizedRowsIndexes.includes(rowIndex)}
                  dominationResults={dominationResults}
                  winnerIndex={winnerIndex}
                  focusedCell={focusedCell}
                  setFocusedCell={setFocusedCell}
                  updateObjective={updateObjective}
                  updateUnit={updateUnit}
                  toggleSortDirection={toggleSortDirection}
                  updateCell={updateCell}
                  onRemoveObjective={handleRemoveObjective}
                  isLastRow={rowIndex === objectives.length - 1}
                />
              ))}

              <TableConclusions
                alternatives={alternatives}
                objectives={objectives}
                cells={cells}
                showRanking={showRanking}
                dominationResults={dominationResults}
                rejectedAlternatives={rejectedAlternatives}
                showRejected={showRejected}
                winnerIndex={winnerIndex}
                completeAlts={completeAlts}
                restoreAlternative={restoreAlternative}
                rejectAlternative={rejectAlternative}
              />
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center px-1">
        <div></div>
        <div className="flex gap-3">
          {equalizedCount > 0 && (
            <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={toggleHideEqualized}>
              {hideEqualizedObjectives ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {hideEqualizedObjectives ? `Pokaż wyrównane cele (${equalizedCount})` : `Ukryj wyrównane cele (${equalizedCount})`}
            </button>
          )}

          {rejectedAlternatives.length > 0 && (
            <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={toggleShowRejected}>
              {showRejected ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showRejected ? `Ukryj odrzucone opcje (${rejectedAlternatives.length})` : `Pokaż odrzucone opcje (${rejectedAlternatives.length})`}
            </button>
          )}
        </div>
      </div>

      <datalist id="scale-suggestions">
        {store.customScales.map((scale, index) => <option key={index} value={scale.word} />)}
      </datalist>

      <datalist id="unit-suggestions">
        <option value="zł" /><option value="$" /><option value="€" /><option value="m²" /><option value="m" /><option value="km" /><option value="kg" /><option value="min" /><option value="h" /><option value="%" /><option value="szt." />
      </datalist>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeConfirmModal}
        onConfirm={() => { if (modalConfig.onConfirm) modalConfig.onConfirm(); }}
        title={modalConfig.title}
        message={modalConfig.message}
        variant="danger"
        confirmText="Usuń"
      />
    </div>
  );
}