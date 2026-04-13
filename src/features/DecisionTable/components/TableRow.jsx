export function TableRow({
  rowIndex,
  objName,
  alternatives,
  cells,
  objectiveUnits,
  showRanking,
  sortDirections,
  showTradeoffs,
  originalCells,
  hideEqualizedObjectives,
  rejectedAlternatives,
  showRejected,
  rowRanks,
  isRowEqual,
  dominationResults,
  winnerIndex,
  focusedCell,
  setFocusedCell,
  updateObjective,
  updateUnit,
  toggleSortDirection,
  updateCell,
  onRemoveObjective,
  isLastRow,
}) {
  const isLowerBetter = sortDirections[rowIndex] === "lower";
  let trClass = "hover:bg-muted/20 transition-colors";
  
  if (isRowEqual) {
    trClass += " bg-muted/40 opacity-50";
    if (hideEqualizedObjectives) trClass += " hidden";
  }

  return (
    <tr className={trClass}>
      <td
        className={`sticky left-0 z-[11] bg-card/90 backdrop-blur-md shadow-[inset_-1px_0_0_var(--border),inset_0_-1px_0_var(--border)] px-4 py-2.5 align-middle overflow-hidden text-ellipsis ${
          isLastRow && !showRanking ? "rounded-bl-xl" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            className="inline-flex justify-center items-center bg-card text-muted-foreground font-bold cursor-pointer transition-all border border-border w-[22px] h-[22px] rounded-full text-sm leading-none enabled:hover:border-destructive enabled:hover:text-destructive enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            onClick={() => onRemoveObjective(rowIndex)}
            title="Usuń ten cel"
            disabled={showRanking}
          >
            -
          </button>
          <input
            className={`w-full py-1.5 px-2 border border-transparent bg-transparent rounded-md text-sm transition-all box-border font-medium flex-1 min-w-[100px] [&:not(:read-only)]:hover:bg-muted/50 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-card [&:not(:read-only)]:focus:border-primary [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-primary/20 text-foreground ${
              isRowEqual ? "line-through !text-muted-foreground" : ""
            }`}
            value={objName}
            onChange={(e) => updateObjective(rowIndex, e.target.value)}
            disabled={showRanking}
            placeholder="Nazwa celu"
          />
          <input
            className={`w-[60px] py-1 px-1 border border-transparent bg-transparent hover:border-dashed hover:border-border rounded text-xs transition-all box-border text-center shrink-0 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-card [&:not(:read-only)]:focus:border-primary [&:not(:read-only)]:focus:border-solid [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-primary/20 text-muted-foreground ${
              isRowEqual ? "line-through" : ""
            }`}
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
        const unit = objectiveUnits[rowIndex] || "";

        let displayValue = currentVal;
        if (showRanking) {
          displayValue = rowRanks[colIndex] ? `${rowRanks[colIndex]}` : "";
        } else if (!isFocused && currentVal !== "" && unit) {
          if (!currentVal.toString().includes(unit)) {
            displayValue = `${currentVal} ${unit}`;
          }
        }

        const rankVal = rowRanks[colIndex];
        const allRanks = Object.values(rowRanks);
        const maxRank = allRanks.length > 0 ? Math.max(...allRanks) : null;
        
        const isFirst = rankVal === 1;
        const isLast = rankVal === maxRank && maxRank > 1;
        
        const domType = showRanking && dominationResults[colIndex] ? dominationResults[colIndex].type : null;
        const isRejected = rejectedAlternatives.includes(colIndex);
        const isWinner = winnerIndex === colIndex;

        let bgStyle = "bg-card";
        if (isWinner) bgStyle = "bg-green-50 dark:bg-green-900/10";
        else if (domType === "strict") bgStyle = "bg-red-50 dark:bg-red-950/30";
        else if (domType === "practical") bgStyle = "bg-amber-50 dark:bg-amber-950/30";

        let tdClass = "";
        if (isRejected && !showRejected) tdClass = "hidden";
        else if (isRejected && showRejected) tdClass = "opacity-30";

        const originalVal = originalCells[cellKey] || "";
        const hasChangedInTradeoff = showTradeoffs && !showRanking && originalVal !== "" && originalVal !== currentVal;
        const hasValidValue = cells[cellKey] !== undefined && cells[cellKey].toString().trim() !== "";
        const showGreenDot = !showRanking && isFirst && maxRank > 1 && hasValidValue && !isRowEqual;

        const inputColor = showRanking ? (isFirst ? "text-green-600 dark:text-green-400" : (isLast ? "text-red-600 dark:text-red-400" : "text-foreground")) : "text-foreground";
        const inputWeight = showRanking ? "font-bold" : "font-normal";

        return (
          <td
            key={cellKey}
            className={`p-1.5 align-middle border-b border-r border-border overflow-hidden text-ellipsis transition-colors ${bgStyle} ${tdClass} ${
              isLastRow && colIndex === alternatives.length - 1 && !showRanking ? "rounded-br-xl" : ""
            }`}
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
                className={`w-full py-1.5 px-0.5 border border-transparent bg-transparent rounded-md text-sm transition-all box-border text-center [&:not(:read-only)]:hover:bg-muted/50 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-card [&:not(:read-only)]:focus:border-primary [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-primary/20 read-only:text-center ${inputColor} ${inputWeight} ${
                  isRowEqual ? "line-through !text-muted-foreground" : ""
                }`}
                value={displayValue}
                onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                placeholder={showRanking ? "-" : "wartość"}
                readOnly={showRanking}
                list={!showRanking ? "scale-suggestions" : undefined}
                onFocus={() => {
                  if (!showRanking) {
                    setFocusedCell(cellKey);
                    if (unit && currentVal.toString().includes(unit)) {
                      const cleanVal = currentVal.toString().replace(unit, "").trim();
                      updateCell(rowIndex, colIndex, cleanVal);
                    }
                  }
                }}
                onBlur={(e) => {
                  setFocusedCell(null);
                  if (showRanking) return;
                  const val = e.target.value;
                  if (!val) return;
                  
                  const unitToFormat = objectiveUnits[rowIndex] || "";
                  let cleanStr = val.replace(/\s/g, "");
                  if (unitToFormat) {
                    cleanStr = cleanStr.split(unitToFormat.replace(/\s/g, "")).join("");
                  }
                  cleanStr = cleanStr.replace(",", ".");
                  
                  if (!isNaN(cleanStr) && cleanStr !== "") {
                    const num = Number(cleanStr);
                    let formatted = num.toLocaleString("pl-PL", { maximumFractionDigits: 4 });
                    if (unitToFormat) formatted += ` ${unitToFormat}`;
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
}