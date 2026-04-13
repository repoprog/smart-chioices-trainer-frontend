import { Button } from "../../../components/ui/Button";
import { Crown } from "lucide-react";


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
     
      <td className="sticky left-0 z-[11] bg-card/90 backdrop-blur-md text-right text-[11px] text-muted-foreground uppercase font-bold pr-5 whitespace-nowrap border-b border-r border-border py-4 shadow-[inset_-1px_0_0_var(--border)] rounded-bl-xl">
        Wnioski z analizy Smart Choices →
      </td>
      
      {alternatives.map((_, colIndex) => {
        const isRejected = rejectedAlternatives.includes(colIndex);
        const isWinner = winnerIndex === colIndex;
        const isComplete = completeAlts.includes(colIndex);
        const dom = dominationResults[colIndex];
        const isLastCell = colIndex === alternatives.length - 1;

        // ... logika isEmptyAlt zostaje ...
        const isEmptyAlt = !objectives.some((_, rowIndex) => {
          const val = cells[`${rowIndex}-${colIndex}`];
          return val !== undefined && val.toString().trim() !== "";
        });

        if (isRejected) {
          return (
            <td key={`dom-${colIndex}`} className={`p-1.5 align-middle border-b border-r border-border text-center bg-muted/30 ${!showRejected ? "hidden" : "opacity-40"} ${isLastCell ? 'rounded-br-xl' : ''}`}>
              <Button variant="outline" size="sm" onClick={() => restoreAlternative(colIndex)} className="rounded-full text-xs">
                Przywróć opcję
              </Button>
            </td>
          );
        }

        if (!isComplete) {
            return (
              <td key={`dom-${colIndex}`} className={`p-3 align-middle border-b border-r border-border text-center bg-muted/20 text-[11px] text-muted-foreground ${isLastCell ? 'rounded-br-xl' : ''}`}>
                {!isEmptyAlt && <><span className="font-semibold block mb-1">NIEKOMPLETNA</span>Wypełnij pola.</>}
              </td>
            );
        }

        if (isWinner) {
          return (
            <td 
  key={`dom-${colIndex}`} 
  className={`p-2 align-middle border-b border-r border-border bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-500 text-[11px] font-medium text-center ${isLastCell ? 'rounded-br-xl' : ''}`}
>
  <div className="flex flex-col items-center justify-center mb-1">
    <Crown className="w-5 h-5 text-green-600 dark:text-green-600 mb-1 shrink-0" />
    <span className="text-sm font-bold">ZWYCIĘZCA</span>
  </div>
  <span className="block opacity-90">Optymalna decyzja.</span>
</td>
          );
        }

        if (!dom) return <td key={`dom-${colIndex}`} className={`p-1.5 align-middle border-b border-r border-border bg-card ${isLastCell ? 'rounded-br-xl' : ''}`}></td>;

        if (dom.type === "strict") {
          return (
            <td key={`dom-${colIndex}`} className={`p-3 align-middle border-b border-r border-border bg-red-50 dark:bg-red-950/30 text-[11px] text-center ${isLastCell ? 'rounded-br-xl' : ''}`}>
              <span className="text-xs block mb-1 font-bold uppercase text-red-700 dark:text-red-400">Zdominowana</span>
              <span className="block mb-2 text-red-600/80 dark:text-red-400/80">Przegrała z <b>{dom.by}</b>.</span>
              <Button variant="destructive" size="sm" className="w-full text-[11px]" onClick={() => rejectAlternative(colIndex)}>
                Odrzuć opcję
              </Button>
            </td>
          );
        } else {
          return (
            <td key={`dom-${colIndex}`} className={`p-3 align-middle border-b border-r border-border bg-amber-50 dark:bg-amber-950/30 text-[11px] text-center ${isLastCell ? 'rounded-br-xl' : ''}`}>
              <span className="text-xs block mb-1 font-bold uppercase text-amber-700 dark:text-amber-500">Rozważ odrzucenie</span>
              <span className="block mb-2 text-amber-600/80 dark:text-amber-500/80">Lepsza od <b>{dom.by}</b> tylko w <b>"{dom.objective}"</b>.</span>
              
              <Button 
                variant="amberOutline" 
                size="sm" 
                className="w-full text-[11px]" 
                onClick={() => rejectAlternative(colIndex)}
              >
                Odrzuć opcję
              </Button>
            </td>
          );
        }
      })}
    </tr>
  );
}