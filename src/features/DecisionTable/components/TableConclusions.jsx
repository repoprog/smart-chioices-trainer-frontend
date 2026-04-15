import React from 'react';
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge"; // <-- IMPORT NOWEGO KOMPONENTU
import { Crown } from "lucide-react";

// CORE MECHANIC: Renders the final analysis row, evaluating Pareto domination,
// completeness, and determining the ultimate winner of the decision matrix.
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
      {/* Sticky Header for Conclusions */}
      <td className="sticky left-0 z-[11] bg-card/90 backdrop-blur-md text-right text-[11px] text-muted-foreground uppercase font-bold pr-5 whitespace-nowrap border-b border-r border-border py-4 shadow-[inset_-1px_0_0_var(--border)] rounded-bl-xl">
        Wnioski z analizy Smart Choices →
      </td>
      
      {/* CORE MECHANIC: Evaluate and render status for each alternative */}
      {alternatives.map((_, colIndex) => {
        const isRejected = rejectedAlternatives.includes(colIndex);
        const isWinner = winnerIndex === colIndex;
        const isComplete = completeAlts.includes(colIndex);
        const dom = dominationResults[colIndex];
        const isLastCell = colIndex === alternatives.length - 1;

        const isEmptyAlt = !objectives.some((_, rowIndex) => {
          const val = cells[`${rowIndex}-${colIndex}`];
          return val !== undefined && val.toString().trim() !== "";
        });

        // 1. STATE: REJECTED
        if (isRejected) {
          return (
            <td key={`dom-${colIndex}`} className={`p-1.5 align-middle border-b border-r border-border text-center bg-muted/30 ${!showRejected ? "hidden" : "opacity-40"} ${isLastCell ? 'rounded-br-xl' : ''}`}>
              <Button variant="outline" size="sm" onClick={() => restoreAlternative(colIndex)} className="rounded-full text-xs">
                Przywróć opcję
              </Button>
            </td>
          );
        }

        // 2. STATE: INCOMPLETE
        if (!isComplete) {
            return (
              <td key={`dom-${colIndex}`} className={`p-3 align-middle border-b border-r border-border text-center bg-muted/20 text-[11px] text-muted-foreground ${isLastCell ? 'rounded-br-xl' : ''}`}>
                {!isEmptyAlt && (
                  <div className="flex flex-col items-center gap-1.5">
                    <Badge variant="default">NIEKOMPLETNA</Badge>
                    <span>Wypełnij pola.</span>
                  </div>
                )}
              </td>
            );
        }

        // 3. STATE: WINNER
        if (isWinner) {
          return (
            <td 
              key={`dom-${colIndex}`} 
              className={`p-2 align-middle border-b border-r border-border bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-500 text-[11px] font-medium text-center ${isLastCell ? 'rounded-br-xl' : ''}`}
            >
              <div className="flex flex-col items-center justify-center mb-1.5 mt-1">
                <Badge variant="success" className="px-3 py-1 shadow-sm">
                  <Crown className="w-4 h-4 mr-1.5" />
                  ZWYCIĘZCA
                </Badge>
              </div>
              <span className="block opacity-90">Optymalna decyzja.</span>
            </td>
          );
        }

        // 4. STATE: NO DOMINATION (Neutral)
        if (!dom) return <td key={`dom-${colIndex}`} className={`p-1.5 align-middle border-b border-r border-border bg-card ${isLastCell ? 'rounded-br-xl' : ''}`}></td>;

        // 5. STATE: STRICT DOMINATION
        if (dom.type === "strict") {
          return (
            <td key={`dom-${colIndex}`} className={`p-3 align-middle border-b border-r border-border bg-red-50 dark:bg-red-950/30 text-[11px] text-center ${isLastCell ? 'rounded-br-xl' : ''}`}>
              <Badge variant="danger" className="mb-2">Zdominowana</Badge>
              <span className="block mb-2.5 text-red-600/80 dark:text-red-400/80">Przegrała z <b>{dom.by}</b>.</span>
              <Button variant="destructive" size="sm" className="w-full text-[11px]" onClick={() => rejectAlternative(colIndex)}>
                Odrzuć opcję
              </Button>
            </td>
          );
        } 
        
        // 6. STATE: PRACTICAL DOMINATION
        else {
          return (
            <td key={`dom-${colIndex}`} className={`p-3 align-middle border-b border-r border-border bg-amber-50 dark:bg-amber-950/30 text-[11px] text-center ${isLastCell ? 'rounded-br-xl' : ''}`}>
              <Badge variant="warning" className="mb-2">Rozważ odrzucenie</Badge>
              <span className="block mb-2.5 text-amber-600/80 dark:text-amber-500/80">Lepsza od <b>{dom.by}</b> tylko w <b>"{dom.objective}"</b>.</span>
              
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