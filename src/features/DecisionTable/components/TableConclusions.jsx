import React from 'react';
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge"; 
import { Crown, Info, ArrowRightLeft } from "lucide-react";
import { DOMINATION_TYPES } from '../../../constants/decisionTypes';

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
  toggleTradeoffs // <--- DODANY PROPS: Przekaż to z TableGrid.jsx
}) {
  
  // 1. Sprawdzamy czy powinniśmy w ogóle rysować ten wiersz
  const shouldRender =
    showRanking &&
    (Object.keys(dominationResults).length > 0 ||
      winnerIndex !== null ||
      rejectedAlternatives.length > 0 ||
      completeAlts.length < alternatives.length ||
      // Dodajemy warunek: Rysuj, nawet jeśli tabela jest "zablokowana" 
      completeAlts.length === alternatives.map((_,i)=>i).filter(i=>!rejectedAlternatives.includes(i)).length);

  if (!shouldRender) return null;

  // 2. Detekcja STANU KOMPROMISU:
  // Tabela jest w 100% pełna, nikt nie jest odrzucony, nie ma zwycięzcy ani żadnych dominacji.
  // Wtedy system powinien zasugerować wymianę równowartościową (Tradeoffs).
  const activeAltsCount = alternatives.filter((_, i) => !rejectedAlternatives.includes(i)).length;
  const isStuckInTradeoffPhase = 
    completeAlts.length === activeAltsCount && 
    winnerIndex === null && 
    Object.keys(dominationResults).length === 0 &&
    activeAltsCount > 1;

  return (
    <tr>
      {/* 3. Zmieniony nagłówek z solidnym tłem dymku i resetem stylów */}
      <td className="sticky left-0 z-[50] bg-card/90 backdrop-blur-md text-right text-muted-foreground font-bold pr-5 whitespace-nowrap border-b border-r border-border py-4 shadow-[inset_-1px_0_0_var(--border)] rounded-bl-xl overflow-visible">
        <div className="flex items-center justify-end gap-2 text-sm uppercase tracking-wider">
          ANALIZA SMART
          
          {/* Kontener grupy (wykrywa najechanie myszką) */}
          <div className="relative group cursor-help">
            <Info className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            
            {/* Chmurka (Dodałem solidne tło 'bg-popover' i 'z-[60]') */}
<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-[320px] p-4 bg-card border border-border shadow-2xl rounded-xl z-[60] normal-case tracking-normal font-normal text-left text-foreground pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">              
              {/* Reset stylów dla tekstu wewnątrz (normal-case, tracking-normal, font-normal, whitespace-normal) */}
              <div className="space-y-3 whitespace-normal normal-case tracking-normal font-normal leading-snug">
                <div>
                  <strong className="text-destructive block mb-1 text-[13px] font-semibold">Dominacja ścisła</strong>
                <p className="text-xs text-muted-foreground m-0 leading-relaxed">
                  Istnieje inna opcja, która jest lepsza lub równa we wszystkich kryteriach. Tę opcję możesz bezpiecznie odrzucić.
                </p>
              </div>
              
              <div>
                  <strong className="text-amber-500 dark:text-amber-400 block mb-1 text-[13px] font-semibold">Dominacja praktyczna</strong>
                <p className="text-xs text-muted-foreground m-0 leading-relaxed">
                  Istnieje opcja lepsza w niemal wszystkim. Oceniana opcja zachowuje przewagę tylko w jednym kryterium (o max. 1 pozycję). Rozważ jej odrzucenie dla uproszczenia.
                </p>
                </div>
              </div>

              {/* Mały trójkącik (Dodałem 'bg-popover') */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-popover border-b border-r border-border rotate-45 z-[59]"></div>
            </div>
          </div>

        </div>
      </td>
      
      {/* 4. STAN KOMPROMISU (Jeden duży wiersz łączący wszystkie kolumny) */}
      {isStuckInTradeoffPhase ? (
        <td colSpan={alternatives.length} className="p-4 align-middle border-b border-border bg-purple-50/50 dark:bg-purple-950/20 text-center rounded-br-xl">
           <div className="flex flex-col items-center justify-center space-y-2">
             <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                Algorytm nie wyłonił jednoznacznego zwycięzcy.
             </span>
             <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Aby kontynuować analizę przejdź do trybu kompromisy.
              
             </p>
             <Button 
                variant="default" 
                size="sm" 
                className="mt-2 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={toggleTradeoffs}
             >
               <ArrowRightLeft className="w-4 h-4 mr-2" />
               Uruchom Kompromisy
             </Button>
           </div>
        </td>
      ) : (
        /* 5. STANDARDOWE KOLUMNY WYNIKÓW (Gdy mamy dominacje/braki/zwycięzcę) */
        alternatives.map((_, colIndex) => {
          const isRejected = rejectedAlternatives.includes(colIndex);
          const isWinner = winnerIndex === colIndex;
          const isComplete = completeAlts.includes(colIndex);
          const dom = dominationResults[colIndex];
          const isLastCell = colIndex === alternatives.length - 1;

          const isEmptyAlt = !objectives.some((_, rowIndex) => {
            const val = cells[`${rowIndex}-${colIndex}`];
            return val !== undefined && val !== null && val.toString().trim() !== "";
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

          // 4. STATE: NO DOMINATION (Neutral - Candidate is still in the race)
          if (!dom) return (
             <td key={`dom-${colIndex}`} className={`p-3 align-middle border-b border-r border-border bg-card text-center ${isLastCell ? 'rounded-br-xl' : ''}`}>
                 
             </td>
          );

          // 5. STATE: STRICT DOMINATION
          if (dom.type === DOMINATION_TYPES.STRICT) {
            return (
              <td key={`dom-${colIndex}`} className={`p-3 align-middle border-b border-r border-border bg-red-50 dark:bg-red-950/30 text-[11px] text-center ${isLastCell ? 'rounded-br-xl' : ''}`}>
                <Badge variant="danger" className="mb-2">Zdominowana</Badge>
                <span className="block mb-2.5 text-red-600/80 dark:text-red-400/80">Przegrała z <b>"{dom.by}"</b>.</span>
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
                <span className="block mb-2.5 text-amber-600/80 dark:text-amber-500/80">Lepsza od <b>"{dom.by}"</b> tylko w kryterium: <b>"{dom.objective}"</b>.</span>
                
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
        })
      )}
    </tr>
  );
}