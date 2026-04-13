

export function TableHeader({
  objectives,
  alternatives,
  showRanking,
  dominationResults,
  rejectedAlternatives,
  showRejected,
  winnerIndex,
  addObjective,
  addAlternative,
  updateAlternative,
  onRemoveAlternative,
}) {
  return (
    <thead>
      <tr>
        <th className="text-center sticky left-0 top-0 z-[30] bg-muted/90 backdrop-blur-md shadow-[inset_-1px_-1px_0_var(--border)] px-4 py-3 align-middle font-semibold text-muted-foreground text-[13px] uppercase tracking-wide rounded-tl-xl">
          <div className="flex justify-center items-center gap-2.5 text-muted-foreground text-xs font-medium whitespace-nowrap">
            {objectives.length === 0 && (
              <span className="inline-flex items-center text-primary bg-primary/10 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-dashed border-primary/30">Dodaj cel →</span>
            )}
            <button className="inline-flex justify-center items-center bg-card text-muted-foreground font-bold cursor-pointer transition-all border border-border w-7 h-7 rounded-lg text-lg leading-none enabled:hover:border-primary/50 enabled:hover:text-foreground enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0" onClick={addObjective} title="Dodaj cel" disabled={showRanking}>+</button>
            <span>{objectives.length} Cele / {alternatives.length} Alternatywy</span>
            <button className="inline-flex justify-center items-center bg-card text-muted-foreground font-bold cursor-pointer transition-all border border-border w-7 h-7 rounded-lg text-lg leading-none enabled:hover:border-primary/50 enabled:hover:text-foreground enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0" onClick={addAlternative} title="Dodaj alternatywę" disabled={showRanking}>+</button>
            {alternatives.length === 0 && (
              <span className="inline-flex items-center text-primary bg-primary/10 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-dashed border-primary/30">← Dodaj opcję</span>
            )}
          </div>
        </th>

        {alternatives.map((alt, colIndex) => {
          const domType = showRanking && dominationResults[colIndex] ? dominationResults[colIndex].type : null;
          const isRejected = rejectedAlternatives.includes(colIndex);
          const isWinner = winnerIndex === colIndex;
          const isLastHeader = colIndex === alternatives.length - 1;

          let headerColor = "text-foreground";
          if (isWinner) headerColor = "text-green-700 dark:text-green-500";
          else if (domType === "strict") headerColor = "text-red-600 dark:text-red-400";
          else if (domType === "practical") headerColor = "text-amber-600 dark:text-amber-400";

          const winnerClasses = isWinner ? "bg-green-50 dark:bg-green-900/10" : "";

          return (
            <th
              key={`col-${colIndex}`}
              className={`p-1.5 align-middle overflow-hidden text-ellipsis sticky top-0 z-[20] shadow-[inset_0_-1px_0_var(--border),inset_-1px_0_0_var(--border)] bg-card/90 backdrop-blur-md ${isRejected && !showRejected ? "hidden" : ""} ${isRejected && showRejected ? "opacity-40" : ""} ${winnerClasses} ${isLastHeader ? "rounded-tr-xl" : ""}`}
              title={alt}
            >
              <div className="flex items-center justify-center gap-1">
                {isWinner}
                <input
                  className={`w-full py-2 px-1 border border-transparent bg-transparent rounded-md text-sm transition-all box-border [&:not(:read-only)]:hover:bg-card/80 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-card [&:not(:read-only)]:focus:border-primary [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-primary/20 uppercase font-bold tracking-wide text-center ${headerColor}`}
                  value={alt}
                  onChange={(e) => updateAlternative(colIndex, e.target.value)}
                  disabled={showRanking}
                />
                <button
                  className="inline-flex justify-center items-center bg-card text-muted-foreground font-bold cursor-pointer transition-all border border-border w-[22px] h-[22px] rounded-full text-sm leading-none enabled:hover:border-destructive enabled:hover:text-destructive enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  onClick={() => onRemoveAlternative(colIndex)}
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
  );
}