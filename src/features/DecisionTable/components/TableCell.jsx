import React, { memo } from 'react';


// CORE MECHANIC: Isolated cell component handling value formatting, tradeoff original states, 
// and dynamic styling based on Pareto domination and ranking results.
export const TableCell = memo(function TableCell({
  rowIndex,
  colIndex,
  currentVal,
  originalVal,
  unit,
  rankVal,
  maxRank,
  isWinner,
  isRejected,
  domType,
  isRowEqual,
  showRanking,
  showRejected,
  showTradeoffs,
  isLastRow,
  isLastCol,
  isFocused,
  setFocusedCell,
  updateCell
}) {
  const cellKey = `${rowIndex}-${colIndex}`;

  // Formatting logic for display
  let displayValue = currentVal;
  if (showRanking) {
    displayValue = rankVal ? `${rankVal}` : "";
  } else if (!isFocused && currentVal !== "" && unit) {
    if (!currentVal.toString().includes(unit)) {
      displayValue = `${currentVal} ${unit}`;
    }
  }

  const isFirst = rankVal === 1;
  const isLast = rankVal === maxRank && maxRank > 1;

  // Background styling based on evaluation state
  let bgStyle = "bg-card";
  if (isWinner) bgStyle = "bg-green-50 dark:bg-green-900/10";
  else if (domType === "strict") bgStyle = "bg-red-50 dark:bg-red-950/30";
  else if (domType === "practical") bgStyle = "bg-amber-50 dark:bg-amber-950/30";

  let tdClass = "";
  if (isRejected && !showRejected) tdClass = "hidden";
  else if (isRejected && showRejected) tdClass = "opacity-30";

  const hasChangedInTradeoff = showTradeoffs && !showRanking && originalVal !== "" && originalVal !== currentVal;
  const hasValidValue = currentVal !== undefined && currentVal.toString().trim() !== "";
  
  // CORE MECHANIC: Highlight the objectively best value in a row when not in strict ranking mode
  const showGreenDot = !showRanking && isFirst && maxRank > 1 && hasValidValue && !isRowEqual;

  const inputColor = showRanking ? (isFirst ? "text-green-600 dark:text-green-400" : (isLast ? "text-red-600 dark:text-red-400" : "text-foreground")) : "text-foreground";
  const inputWeight = showRanking ? "font-bold" : "font-normal";

  // Number formatting logic on blur
  const handleBlur = (e) => {
    setFocusedCell(null);
    if (showRanking) return;
    
    const val = e.target.value;
    if (!val) return;
    
    const unitToFormat = unit || "";
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
  };

  const handleFocus = () => {
    if (!showRanking) {
      setFocusedCell(cellKey);
      if (unit && currentVal.toString().includes(unit)) {
        const cleanVal = currentVal.toString().replace(unit, "").trim();
        updateCell(rowIndex, colIndex, cleanVal);
      }
    }
  };

  return (
    <td
      className={`p-1.5 align-middle border-b border-r border-border overflow-hidden text-ellipsis transition-colors ${bgStyle} ${tdClass} ${
        isLastRow && isLastCol && !showRanking ? "rounded-br-xl" : ""
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
          className={`w-full py-1.5 px-0.5 border border-transparent bg-transparent rounded-md text-sm transition-all box-border text-center 
            [&:not(:read-only)]:hover:bg-muted/50 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-card 
            [&:not(:read-only)]:focus:border-primary [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-primary/20 
            read-only:text-center ${inputColor} ${inputWeight} ${
            isRowEqual ? "line-through !text-muted-foreground" : ""
          }`}
          value={displayValue}
          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
          placeholder={showRanking ? "-" : "wartość"}
          readOnly={showRanking}
          list={!showRanking ? "scale-suggestions" : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
    </td>
  );
});