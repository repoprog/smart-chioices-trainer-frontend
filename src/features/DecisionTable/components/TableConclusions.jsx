export function TableConclusions({
  alternatives,
  objectives,
  cells,
  showRanking,
  dominationResults,
  rejectedAlternatives,
  showRejected,
  winnerIndex,
  completeAlts,
  restoreAlternative,
  rejectAlternative,
}) {
  const shouldRender =
    showRanking &&
    (Object.keys(dominationResults).length > 0 ||
      winnerIndex !== null ||
      rejectedAlternatives.length > 0 ||
      completeAlts.length < alternatives.length);

  if (!shouldRender) return null;

  return (
    <tr>
      <td className="sticky left-0 z-[11] bg-card/90 backdrop-blur-md text-right text-[11px] text-muted-foreground uppercase font-bold pr-5 whitespace-nowrap border-b border-r border-border py-4 shadow-[inset_-1px_0_0_var(--border)]">
        Wnioski z analizy Smart Choices →
      </td>
      {alternatives.map((_, colIndex) => {
        const isRejected = rejectedAlternatives.includes(colIndex);
        const isWinner = winnerIndex === colIndex;
        const isComplete = completeAlts.includes(colIndex);
        const dom = dominationResults[colIndex];

        const isEmptyAlt = !objectives.some((_, rowIndex) => {
          const val = cells[`${rowIndex}-${colIndex}`];
          return val !== undefined && val.toString().trim() !== "";
        });

        if (isRejected) {
          return (
            <td
              key={`dom-${colIndex}`}
              className={`p-1.5 align-middle border-b border-r border-border text-center bg-muted/30 ${
                !showRejected ? "hidden" : "opacity-40"
              }`}
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
              <td key={`dom-${colIndex}`} className="p-1.5 align-middle border-b border-r border-border bg-card"></td>
            );
          }

          return (
            <td
              key={`dom-${colIndex}`}
              className="p-3 align-middle border-b border-r border-border text-center bg-muted/20 text-[11px] text-muted-foreground"
            >
              <span className="font-semibold block mb-1">NIEKOMPLETNA</span>
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
              <span className="text-sm block mb-1 font-bold">🏆 ZWYCIĘZCA</span>
              To optymalna decyzja.
            </td>
          );
        }

        if (!dom) return <td key={`dom-${colIndex}`} className="p-1.5 align-middle border-b border-r border-border bg-card"></td>;

        if (dom.type === "strict") {
          return (
            <td
              key={`dom-${colIndex}`}
              className="p-3 align-middle border-b border-r border-border bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-[11px] font-medium leading-relaxed text-center"
            >
              <span className="text-xs block mb-1 font-bold uppercase">Zdominowana</span>
              <span className="block mb-2 opacity-80">Przegrała z <b>{dom.by}</b>.</span>
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
              <span className="text-xs block mb-1 font-bold uppercase">Rozważ odrzucenie</span>
              <span className="block mb-2 opacity-80">Lepsza od <b>{dom.by}</b> tylko w <b>"{dom.objective}"</b>.</span>
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
  );
}