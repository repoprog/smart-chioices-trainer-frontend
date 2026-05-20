import React, { useState, useMemo } from "react";
import { useTableStore } from '../store/useTableStore';
import { getTradeoffResults, getRowRanks } from "../logic/tableLogic"; 
import { Eye, EyeOff } from 'lucide-react';

import { ConfirmModal } from "../../../components/modals/ConfirmModal";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { TableConclusions } from "./TableConclusions";
import { DOMINATION_TYPES } from "../../../constants/decisionTypes";

// --- FUNKCJA ADAPTERA ---
function mapBackendResultsToLocal(backendResult, store) {
  const { results, winnerIndex } = backendResult;
  const dominationResults = {};

  Object.entries(results || {}).forEach(([colIdx, dto]) => {
    if (dto.domination) {
      dominationResults[Number(colIdx)] = {
        type: dto.domination.type === 'STRICT' ? DOMINATION_TYPES.STRICT : DOMINATION_TYPES.PRACTICAL,      
        by: dto.domination.dominatedByName || "", 
        objective: dto.domination.exceptionalCriterionName || ""
      };
    }
  });

  const completeAlts = Object.entries(results || {})
    .filter(([, dto]) => dto.isComplete)
    .map(([idx]) => Number(idx));

  const localPartial = getTradeoffResults(store);

  return {
    dominationResults,
    winnerIndex: winnerIndex ?? null,
    completeAlts,
    equalizedRowsIndexes: localPartial.equalizedRowsIndexes,
    equalizedCount: localPartial.equalizedCount,
  };
}

// ZMIANA: Odbieramy nowe propsy
export function TableGrid({ readOnlyData = null, readOnlyShowRanking = true }) {
  const isReadOnly = !!readOnlyData;
  const store = useTableStore();
  const [focusedCell, setFocusedCell] = useState(null);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // 1. ZMIANA: Wyciągamy ze store TYLKO to, czego nie nadpiszemy z readOnlyData
  const {
    showTradeoffs, hideEqualizedObjectives, rejectedAlternatives, showRejected,
    customScales, backendAnalysisResult,
    toggleShowRejected, toggleHideEqualized, toggleSortDirection,
    addAlternative, addObjective, updateAlternative, updateObjective, updateUnit,
    rejectAlternative, restoreAlternative, removeAlternative, removeObjective
  } = store;
  
  // 2. MAGIA: Pobranie głównych danych: Jeśli tryb publiczny (readOnlyData), bierzemy z JSON-a. Jeśli nie, ze Store'a.
  const alternatives = isReadOnly ? (readOnlyData.alternatives || []) : store.alternatives;
  const objectives = isReadOnly ? (readOnlyData.objectives || []) : store.objectives;
  const cells = isReadOnly ? (readOnlyData.cells || {}) : store.cells;
  const objectiveUnits = isReadOnly ? (readOnlyData.objectiveUnits || {}) : store.objectiveUnits;
  const sortDirections = isReadOnly ? (readOnlyData.sortDirections || {}) : store.sortDirections;
  
  // 3. ZMIANA: Reagowanie na przycisk z SharedProjectPage 
  const showRanking = isReadOnly ? readOnlyShowRanking : store.showRanking;

  // 4. Tworzymy atrapę store'a dla logiki obliczeniowej, by uchronić się przed zepsuciem podczas podglądu z cudzych danych
  const mockStoreContext = isReadOnly ? {
    alternatives, objectives, cells, objectiveUnits, sortDirections,
    showRanking, showTradeoffs, hideEqualizedObjectives, rejectedAlternatives, showRejected, customScales
  } : store;

  const localResults = useMemo(() => getTradeoffResults(mockStoreContext), [
    showRanking, showTradeoffs, alternatives, objectives,
    rejectedAlternatives, cells, customScales, sortDirections, mockStoreContext
  ]);

  // Używamy analizy z Javy jeśli jest w stanie, ALBO jeśli dostaliśmy ją w payloadzie linku
  const activeBackendResult = isReadOnly ? readOnlyData.backendAnalysisResult : backendAnalysisResult;

  const {
    equalizedRowsIndexes, equalizedCount, dominationResults,
    winnerIndex, completeAlts,
  } = activeBackendResult
    ? mapBackendResultsToLocal(activeBackendResult, mockStoreContext)
    : localResults;

  const closeConfirmModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  // Blokady kliknięć
  const handleRemoveAlternative = (indexToRemove) => {
    if (isReadOnly) return;
    const hasData = objectives.some((_, r) => cells[`${r}-${indexToRemove}`] && cells[`${r}-${indexToRemove}`].toString().trim() !== "");
    if (hasData) {
      setModalConfig({
        isOpen: true,
        title: "Usuwanie alternatywy",
        message: `Alternatywa "${alternatives[indexToRemove]}" zawiera wpisane dane. Czy na pewno chcesz ją usunąć?`,
        onConfirm: () => removeAlternative(indexToRemove), 
      });
    } else {
      removeAlternative(indexToRemove); 
    }
  };

  const handleRemoveObjective = (indexToRemove) => {
    if (isReadOnly) return;
    const hasData = alternatives.some((_, c) => cells[`${indexToRemove}-${c}`] && cells[`${indexToRemove}-${c}`].toString().trim() !== "");
    if (hasData) {
      setModalConfig({
        isOpen: true,
        title: "Usuwanie celu",
        message: `Cel "${objectives[indexToRemove]}" zawiera wpisane dane. Czy na pewno chcesz go usunąć?`,
        onConfirm: () => removeObjective(indexToRemove), 
      });
    } else {
      removeObjective(indexToRemove); 
    }
  };

  // Klasa blokująca edycję w trybie udostępniania
  const readOnlyClasses = isReadOnly 
    ? "[&_input]:pointer-events-none [&_input]:!bg-transparent [&_button]:hidden [&_button.flex]:flex" 
    : "";

  return (
    <div className={`w-full pb-6 ${readOnlyClasses}`}>
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
                  objectiveUnits={objectiveUnits}
                  showRanking={showRanking}
                  sortDirections={sortDirections}
                  showTradeoffs={showTradeoffs}
                  hideEqualizedObjectives={hideEqualizedObjectives}
                  rejectedAlternatives={rejectedAlternatives}
                  showRejected={showRejected}
                  rowRanks={getRowRanks(rowIndex, mockStoreContext)} 
                  isRowEqual={equalizedRowsIndexes.includes(rowIndex)}
                  dominationResults={dominationResults}
                  winnerIndex={winnerIndex}
                  focusedCell={focusedCell}
                  setFocusedCell={setFocusedCell}
                  updateObjective={updateObjective}
                  updateUnit={updateUnit}
                  toggleSortDirection={toggleSortDirection}
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
                toggleTradeoffs={store.toggleTradeoffs}
              />
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center px-1">
        <div></div>
        <div className="flex gap-3">
          {equalizedCount > 0 && (
            <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={isReadOnly ? undefined : toggleHideEqualized}>
              {hideEqualizedObjectives ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {hideEqualizedObjectives ? `Pokaż wyrównane cele (${equalizedCount})` : `Ukryj wyrównane cele (${equalizedCount})`}
            </button>
          )}

          {rejectedAlternatives.length > 0 && (
            <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors" onClick={isReadOnly ? undefined : toggleShowRejected}>
              {showRejected ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showRejected ? `Ukryj odrzucone opcje (${rejectedAlternatives.length})` : `Pokaż odrzucone opcje (${rejectedAlternatives.length})`}
            </button>
          )}
        </div>
      </div>

      <datalist id="scale-suggestions">
        {customScales.map((scale, index) => <option key={index} value={scale.word} />)}
      </datalist>

      <datalist id="unit-suggestions">
        <option value="zł" /><option value="$" /><option value="€" /><option value="m²" /><option value="m" /><option value="km" /><option value="kg" /><option value="min" /><option value="h" /><option value="%" /><option value="szt." />
      </datalist>

      {!isReadOnly && (
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={closeConfirmModal}
          onConfirm={() => { if (modalConfig.onConfirm) modalConfig.onConfirm(); }}
          title={modalConfig.title}
          message={modalConfig.message}
          variant="danger"
          confirmText="Usuń"
        />
      )}
    </div>
  );
}