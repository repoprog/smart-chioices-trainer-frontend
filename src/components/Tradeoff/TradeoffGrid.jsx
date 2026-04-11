import React, { useState } from "react";
import { useTradeoffStore } from "../../store/useTradeOffStore";
import { getTradeoffResults, getRowRanks } from "../../logic/tradeoffLogic";
import { Eye, EyeOff, Crown } from "lucide-react";

import ConfirmModal from ".././ConfirmModal";

export function TradeoffGrid() {
  const store = useTradeoffStore();

  const [focusedCell, setFocusedCell] = useState(null);

  // NOWY STAN DLA UNIWERSALNEGO MODALA POTWIERDZENIA

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,

    title: "",

    message: "",

    onConfirm: null,
  });

  const {
    alternatives,
    objectives,
    cells,
    objectiveUnits,
    showRanking,
    sortDirections,

    showTradeoffs,
    originalCells,
    hideEqualizedObjectives,
    rejectedAlternatives,
    showRejected,

    toggleShowRejected,
    toggleHideEqualized,
    toggleSortDirection,

    addAlternative,
    addObjective,
    updateAlternative,
    updateObjective,
    updateCell,
    updateUnit,

    rejectAlternative,
    restoreAlternative,
  } = store;

  const {
    equalizedRowsIndexes,
    equalizedCount,
    dominationResults,

    winnerIndex,
    completeAlts,
  } = getTradeoffResults(store);

  const closeConfirmModal = () =>
    setModalConfig({ ...modalConfig, isOpen: false });

  // WYCIĄGNIĘTA LOGIKA USUWANIA ALTERNATYWY

  const executeRemoveAlt = (indexToRemove) => {
    useTradeoffStore.setState((state) => {
      const newAlternatives = state.alternatives.filter(
        (_, index) => index !== indexToRemove,
      );

      const newCells = {};

      for (let r = 0; r < state.objectives.length; r++) {
        for (let c = 0; c < state.alternatives.length; c++) {
          if (c === indexToRemove) continue;

          const newC = c > indexToRemove ? c - 1 : c;

          if (state.cells[`${r}-${c}`] !== undefined)
            newCells[`${r}-${newC}`] = state.cells[`${r}-${c}`];
        }
      }

      return {
        alternatives: newAlternatives,

        cells: newCells,

        rejectedAlternatives: state.rejectedAlternatives
          .filter((c) => c !== indexToRemove)
          .map((c) => (c > indexToRemove ? c - 1 : c)),
      };
    });
  };

  const handleRemoveAlternative = (indexToRemove) => {
    const hasData = objectives.some(
      (_, r) =>
        cells[`${r}-${indexToRemove}`] &&
        cells[`${r}-${indexToRemove}`].toString().trim() !== "",
    );

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

  // WYCIĄGNIĘTA LOGIKA USUWANIA CELU

  const executeRemoveObj = (indexToRemove) => {
    useTradeoffStore.setState((state) => {
      const newObjectives = state.objectives.filter(
        (_, index) => index !== indexToRemove,
      );

      const newCells = {};

      for (let r = 0; r < state.objectives.length; r++) {
        if (r === indexToRemove) continue;

        const newR = r > indexToRemove ? r - 1 : r;

        for (let c = 0; c < state.alternatives.length; c++) {
          if (state.cells[`${r}-${c}`] !== undefined)
            newCells[`${newR}-${c}`] = state.cells[`${r}-${c}`];
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
    const hasData = alternatives.some(
      (_, c) =>
        cells[`${indexToRemove}-${c}`] &&
        cells[`${indexToRemove}-${c}`].toString().trim() !== "",
    );

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
      <div
        className={`relative isolate rounded-xl transition-all duration-500 border border-border bg-card shadow-sm overflow-hidden
    ${
      showTradeoffs
        ? "ring-2 ring-purple-500 z-20 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
        : ""
    }`}
      >
        <div className="overflow-x-auto w-full">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              <col className="w-[300px] md:w-[360px]" />

              {alternatives.map((_, i) => (
                <col
                  key={i}
                  className={`min-w-[150px] ${rejectedAlternatives.includes(i) && !showRejected ? "hidden" : ""}`}
                />
              ))}
            </colgroup>

            <thead>
              <tr>
                <th className="text-center sticky left-0 top-0 z-[30] bg-muted/60 backdrop-blur-xl shadow-[inset_-1px_-1px_0_var(--border)] px-4 py-3 align-middle font-semibold text-muted-foreground text-[13px] uppercase tracking-wide rounded-tl-xl">
                  <div className="flex justify-center items-center gap-2.5 text-muted-foreground text-xs font-medium whitespace-nowrap">
                    {objectives.length === 0 && (
                      <span className="inline-flex items-center text-primary bg-primary/10 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-dashed border-primary/30">
                        Dodaj cel →
                      </span>
                    )}

                    <button
                      className="inline-flex justify-center items-center bg-card text-muted-foreground font-bold cursor-pointer transition-all border border-border w-7 h-7 rounded-lg text-lg leading-none enabled:hover:border-primary/50 enabled:hover:text-foreground enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      onClick={addObjective}
                      title="Dodaj cel"
                      disabled={showRanking}
                    >
                      +
                    </button>

                    <span>
                      {objectives.length} Cele / {alternatives.length}{" "}
                      Alternatywy
                    </span>

                    <button
                      className="inline-flex justify-center items-center bg-card text-muted-foreground font-bold cursor-pointer transition-all border border-border w-7 h-7 rounded-lg text-lg leading-none enabled:hover:border-primary/50 enabled:hover:text-foreground enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      onClick={addAlternative}
                      title="Dodaj alternatywę"
                      disabled={showRanking}
                    >
                      +
                    </button>

                    {alternatives.length === 0 && (
                      <span className="inline-flex items-center text-primary bg-primary/10 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-dashed border-primary/30">
                        ← Dodaj opcję
                      </span>
                    )}
                  </div>
                </th>

                {alternatives.map((alt, colIndex) => {
                  const domType =
                    showRanking && dominationResults[colIndex]
                      ? dominationResults[colIndex].type
                      : null;

                  const isRejected = rejectedAlternatives.includes(colIndex);

                  const isWinner = winnerIndex === colIndex;

                  const isLastHeader = colIndex === alternatives.length - 1;

                  let headerColor = "text-foreground";

                  if (isWinner)
                    headerColor = "text-green-700 dark:text-green-500";
                  else if (domType === "strict")
                    headerColor = "text-red-600 dark:text-red-400";
                  else if (domType === "practical")
                    headerColor = "text-amber-600 dark:text-amber-400";

                  const winnerClasses = isWinner
                    ? "bg-green-50 dark:bg-green-900/10"
                    : "";

                  return (
                    <th
                      key={`col-${colIndex}`}
                      className={`p-1.5 align-middle overflow-hidden text-ellipsis sticky top-0 z-[20] shadow-[inset_0_-1px_0_var(--border),inset_-1px_0_0_var(--border)] bg-card/60 backdrop-blur-md ${isRejected && !showRejected ? "hidden" : ""} ${isRejected && showRejected ? "opacity-40" : ""} ${winnerClasses} ${isLastHeader ? "rounded-tr-xl" : ""}`}
                      title={alt}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {isWinner && (
                          <Crown className="w-4 h-4 text-green-600 shrink-0" />
                        )}

                        <input
                          className={`w-full py-2 px-1 border border-transparent bg-transparent rounded-md text-sm transition-all box-border [&:not(:read-only)]:hover:bg-card/80 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-card [&:not(:read-only)]:focus:border-primary [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-primary/20 uppercase font-bold tracking-wide text-center ${headerColor}`}
                          value={alt}
                          onChange={(e) =>
                            updateAlternative(colIndex, e.target.value)
                          }
                          disabled={showRanking}
                        />

                        <button
                          className="inline-flex justify-center items-center bg-card text-muted-foreground font-bold cursor-pointer transition-all border border-border w-[22px] h-[22px] rounded-full text-sm leading-none enabled:hover:border-destructive enabled:hover:text-destructive enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          onClick={() => handleRemoveAlternative(colIndex)}
                          title="Usuń tę alternatywę"
                          disabled={showRanking}
                        >
                          -
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {objectives.map((obj, rowIndex) => {
                const rowRanks = getRowRanks(rowIndex, store);

                const isLowerBetter = sortDirections[rowIndex] === "lower";

                const isRowEqual = equalizedRowsIndexes.includes(rowIndex);

                let trClass = "hover:bg-muted/20 transition-colors";

                if (isRowEqual) {
                  trClass += " bg-muted/40 opacity-50";

                  if (hideEqualizedObjectives) trClass += " hidden";
                }

                return (
                  <tr key={`row-${rowIndex}`} className={trClass}>
                    <td
                      className={`sticky left-0 z-[11] bg-card/60 backdrop-blur-xl px-4 py-2.5 align-middle overflow-hidden text-ellipsis 

    border-r border-b border-border shadow-none

    ${rowIndex === objectives.length - 1 && !showRanking ? "rounded-bl-xl" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex justify-center items-center bg-card text-muted-foreground font-bold cursor-pointer transition-all border border-border w-[22px] h-[22px] rounded-full text-sm leading-none enabled:hover:border-destructive enabled:hover:text-destructive enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                          onClick={() => handleRemoveObjective(rowIndex)}
                          title="Usuń ten cel"
                          disabled={showRanking}
                        >
                          -
                        </button>

                        <input
                          className={`w-full py-1.5 px-2 border border-transparent bg-transparent rounded-md text-sm transition-all box-border font-medium flex-1 min-w-[100px] [&:not(:read-only)]:hover:bg-muted/50 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-card [&:not(:read-only)]:focus:border-primary [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-primary/20 text-foreground ${isRowEqual ? "line-through !text-muted-foreground" : ""}`}
                          value={obj}
                          onChange={(e) =>
                            updateObjective(rowIndex, e.target.value)
                          }
                          disabled={showRanking}
                          placeholder="Nazwa celu"
                        />

                        <input
                          className={`w-[60px] py-1 px-1 border border-transparent bg-transparent hover:border-dashed hover:border-border rounded text-xs transition-all box-border text-center shrink-0 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-card [&:not(:read-only)]:focus:border-primary [&:not(:read-only)]:focus:border-solid [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-primary/20 text-muted-foreground ${isRowEqual ? "line-through" : ""}`}
                          placeholder="np. zł"
                          value={objectiveUnits[rowIndex] || ""}
                          onChange={(e) => updateUnit(rowIndex, e.target.value)}
                          disabled={showRanking}
                          title="Dodaj jednostkę (np. zł, m², min)"
                          list="unit-suggestions"
                        />

                        <button
                          className="shrink-0 w-[60px] h-[24px] flex justify-center items-center cursor-pointer px-1 border-none rounded bg-green-100 text-[11px] leading-none font-bold text-green-800 whitespace-nowrap transition-all enabled:hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground font-sans dark:bg-green-900/30 dark:text-green-400"
                          onClick={() => toggleSortDirection(rowIndex)}
                          title="Kliknij, aby odwrócić ranking dla tego celu"
                          disabled={showRanking}
                        >
                          {isLowerBetter ? "↓ lepiej" : "↑ lepiej"}
                        </button>
                      </div>
                    </td>

                    {alternatives.map((_, colIndex) => {
                      const cellKey = `${rowIndex}-${colIndex}`;

                      const currentVal = cells[cellKey] || "";

                      const isFocused = focusedCell === cellKey;

                      let displayValue = currentVal;

                      const unit = objectiveUnits[rowIndex] || "";

                      if (showRanking) {
                        displayValue = rowRanks[colIndex]
                          ? `${rowRanks[colIndex]}`
                          : "";
                      } else if (!isFocused && currentVal !== "" && unit) {
                        if (!currentVal.toString().includes(unit)) {
                          displayValue = `${currentVal} ${unit}`;
                        }
                      }

                      const rankVal = rowRanks[colIndex];

                      const allRanks = Object.values(rowRanks);

                      const maxRank =
                        allRanks.length > 0 ? Math.max(...allRanks) : null;

                      const isFirst = rankVal === 1;

                      const isLast = rankVal === maxRank && maxRank > 1;

                      const domType =
                        showRanking && dominationResults[colIndex]
                          ? dominationResults[colIndex].type
                          : null;

                      const isRejected =
                        rejectedAlternatives.includes(colIndex);

                      const isWinner = winnerIndex === colIndex;

                      let bgStyle = "bg-card";

                      if (isWinner)
                        bgStyle = "bg-green-50 dark:bg-green-900/10";
                      else if (domType === "strict")
                        bgStyle = "bg-red-50 dark:bg-red-950/30";
                      else if (domType === "practical")
                        bgStyle = "bg-amber-50 dark:bg-amber-950/30";

                      let tdClass = "";

                      if (isRejected && !showRejected) tdClass = "hidden";
                      else if (isRejected && showRejected)
                        tdClass = "opacity-30";

                      const originalVal = originalCells[cellKey] || "";

                      const hasChangedInTradeoff =
                        showTradeoffs &&
                        !showRanking &&
                        originalVal !== "" &&
                        originalVal !== currentVal;

                      const hasValidValue =
                        cells[cellKey] !== undefined &&
                        cells[cellKey].toString().trim() !== "";

                      const showGreenDot =
                        !showRanking &&
                        isFirst &&
                        maxRank > 1 &&
                        hasValidValue &&
                        !isRowEqual;

                      const inputColor = showRanking
                        ? isFirst
                          ? "text-green-600 dark:text-green-400"
                          : isLast
                            ? "text-red-600 dark:text-red-400"
                            : "text-foreground"
                        : "text-foreground";

                      const inputWeight = showRanking
                        ? "font-bold"
                        : "font-normal";

                      return (
                        <td
                          key={`cell-${rowIndex}-${colIndex}`}
                          className={`p-1.5 align-middle border-b border-r border-border overflow-hidden text-ellipsis transition-colors ${bgStyle} ${tdClass}

    ${rowIndex === objectives.length - 1 && colIndex === alternatives.length - 1 && !showRanking ? "rounded-br-xl" : ""}`}
                        >
                          <div className="relative flex flex-row items-center justify-center w-full h-full min-h-[32px]">
                            {hasChangedInTradeoff && (
                              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-destructive line-through whitespace-nowrap pointer-events-none">
                                {originalVal}
                              </span>
                            )}

                            {showGreenDot && (
                              <span
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-green-500 rounded-full z-10 shadow-[0_0_0_2px_rgba(34,197,94,0.2)] pointer-events-none"
                                title="Najlepsza wartość w tym kryterium"
                              />
                            )}

                            <input
                              className={`w-full py-1.5 px-0.5 border border-transparent bg-transparent rounded-md text-sm transition-all box-border text-center [&:not(:read-only)]:hover:bg-muted/50 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-card [&:not(:read-only)]:focus:border-primary [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-primary/20 read-only:text-center ${inputColor} ${inputWeight} ${isRowEqual ? "line-through !text-muted-foreground" : ""}`}
                              value={displayValue}
                              onChange={(e) =>
                                updateCell(rowIndex, colIndex, e.target.value)
                              }
                              placeholder={showRanking ? "-" : "wartość"}
                              readOnly={showRanking}
                              list={
                                !showRanking ? "scale-suggestions" : undefined
                              }
                              onFocus={() => {
                                if (!showRanking) {
                                  setFocusedCell(cellKey);

                                  if (
                                    unit &&
                                    currentVal.toString().includes(unit)
                                  ) {
                                    const cleanVal = currentVal
                                      .toString()
                                      .replace(unit, "")
                                      .trim();

                                    updateCell(rowIndex, colIndex, cleanVal);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                setFocusedCell(null);

                                if (showRanking) return;

                                const val = e.target.value;

                                if (!val) return;

                                const unitToFormat =
                                  objectiveUnits[rowIndex] || "";

                                let cleanStr = val.replace(/\s/g, "");

                                if (unitToFormat) {
                                  cleanStr = cleanStr
                                    .split(unitToFormat.replace(/\s/g, ""))
                                    .join("");
                                }

                                cleanStr = cleanStr.replace(",", ".");

                                if (!isNaN(cleanStr) && cleanStr !== "") {
                                  const num = Number(cleanStr);

                                  let formatted = num.toLocaleString("pl-PL", {
                                    maximumFractionDigits: 4,
                                  });

                                  if (unitToFormat)
                                    formatted += ` ${unitToFormat}`;

                                  if (formatted !== val) {
                                    updateCell(rowIndex, colIndex, formatted);
                                  }
                                }
                              }}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {showRanking &&
                (Object.keys(dominationResults).length > 0 ||
                  winnerIndex !== null ||
                  rejectedAlternatives.length > 0 ||
                  completeAlts.length < alternatives.length) && (
                  <tr>
                    <td className="sticky left-0 z-[11] bg-card/60 backdrop-blur-xl text-right text-[11px] text-muted-foreground uppercase font-bold pr-5 whitespace-nowrap border-b border-r border-border py-4 shadow-[inset_-1px_0_0_var(--border)]">
                      Wnioski z analizy Smart Choices →
                    </td>

                    {alternatives.map((_, colIndex) => {
                      const isRejected =
                        rejectedAlternatives.includes(colIndex);

                      const isWinner = winnerIndex === colIndex;

                      const isComplete = completeAlts.includes(colIndex);

                      const dom = dominationResults[colIndex];

                      const isEmptyAlt = !objectives.some((_, rowIndex) => {
                        const val = cells[`${rowIndex}-${colIndex}`];

                        return (
                          val !== undefined && val.toString().trim() !== ""
                        );
                      });

                      if (isRejected) {
                        return (
                          <td
                            key={`dom-${colIndex}`}
                            className={`p-1.5 align-middle border-b border-r border-border text-center bg-muted/30 ${!showRejected ? "hidden" : "opacity-40"}`}
                          >
                            <button
                              onClick={() => restoreAlternative(colIndex)}
                              className="bg-card border border-border rounded-full px-3 py-1.5 text-xs font-medium text-foreground cursor-pointer transition-all hover:border-primary hover:text-primary"
                            >
                              Przywróć opcję
                            </button>
                          </td>
                        );
                      }

                      if (!isComplete) {
                        if (isEmptyAlt) {
                          return (
                            <td
                              key={`dom-${colIndex}`}
                              className="p-1.5 align-middle border-b border-r border-border bg-card"
                            ></td>
                          );
                        }

                        return (
                          <td
                            key={`dom-${colIndex}`}
                            className="p-3 align-middle border-b border-r border-border text-center bg-muted/20 text-[11px] text-muted-foreground"
                          >
                            <span className="font-semibold block mb-1">
                              NIEKOMPLETNA
                            </span>
                            Wypełnij puste pola.
                          </td>
                        );
                      }

                      if (isWinner) {
                        return (
                          <td
                            key={`dom-${colIndex}`}
                            className="p-2 align-middle border-b border-r border-border bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-500 text-[11px] font-medium leading-relaxed text-center"
                          >
                            <span className="text-sm block mb-1 font-bold">
                              🏆 ZWYCIĘZCA
                            </span>
                            To optymalna decyzja.
                          </td>
                        );
                      }

                      if (!dom)
                        return (
                          <td
                            key={`dom-${colIndex}`}
                            className="p-1.5 align-middle border-b border-r border-border bg-card"
                          ></td>
                        );

                      if (dom.type === "strict") {
                        return (
                          <td
                            key={`dom-${colIndex}`}
                            className="p-3 align-middle border-b border-r border-border bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-[11px] font-medium leading-relaxed text-center"
                          >
                            <span className="text-xs block mb-1 font-bold uppercase">
                              Zdominowana
                            </span>

                            <span className="block mb-2 opacity-80">
                              Przegrała z <b>{dom.by}</b>.
                            </span>

                            <button
                              className="block mx-auto px-3 py-1.5 text-[11px] font-semibold bg-red-600 text-white rounded-md cursor-pointer w-full transition-colors hover:bg-red-700"
                              onClick={() => rejectAlternative(colIndex)}
                            >
                              Odrzuć opcję
                            </button>
                          </td>
                        );
                      } else {
                        return (
                          <td
                            key={`dom-${colIndex}`}
                            className="p-3 align-middle border-b border-r border-border bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[11px] font-medium leading-relaxed text-center"
                          >
                            <span className="text-xs block mb-1 font-bold uppercase">
                              Rozważ odrzucenie
                            </span>

                            <span className="block mb-2 opacity-80">
                              Lepsza od <b>{dom.by}</b> tylko w{" "}
                              <b>"{dom.objective}"</b>.
                            </span>

                            <button
                              className="block mx-auto px-3 py-1.5 text-[11px] font-semibold bg-transparent border border-amber-500 rounded-md cursor-pointer w-full transition-all hover:bg-amber-100 dark:hover:bg-amber-900"
                              onClick={() => rejectAlternative(colIndex)}
                            >
                              Odrzuć opcję
                            </button>
                          </td>
                        );
                      }
                    })}
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center px-1">
        <div></div>

        <div className="flex gap-3">
          {equalizedCount > 0 && (
            <button
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={toggleHideEqualized}
            >
              {hideEqualizedObjectives ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}

              {hideEqualizedObjectives
                ? `Pokaż wyrównane cele (${equalizedCount})`
                : `Ukryj wyrównane cele (${equalizedCount})`}
            </button>
          )}

          {rejectedAlternatives.length > 0 && (
            <button
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={toggleShowRejected}
            >
              {showRejected ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}

              {showRejected
                ? `Ukryj odrzucone opcje (${rejectedAlternatives.length})`
                : `Pokaż odrzucone opcje (${rejectedAlternatives.length})`}
            </button>
          )}
        </div>
      </div>

      <datalist id="scale-suggestions">
        {store.customScales.map((scale, index) => (
          <option key={index} value={scale.word} />
        ))}
      </datalist>

      <datalist id="unit-suggestions">
        <option value="zł" />
        <option value="$" />
        <option value="€" />
        <option value="m²" />
        <option value="m" />
        <option value="km" />
        <option value="kg" />
        <option value="min" />
        <option value="h" />
        <option value="%" />
        <option value="szt." />
      </datalist>

      {/* NASZ NOWY MODAL FIGMA */}

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeConfirmModal}
        onConfirm={() => {
          if (modalConfig.onConfirm) modalConfig.onConfirm();
        }}
        title={modalConfig.title}
        message={modalConfig.message}
        variant="danger"
        confirmText="Usuń"
      />
    </div>
  );
}
