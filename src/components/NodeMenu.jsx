import { useTreeStore } from '../store/useTreeStore.js';

export function NodeMenu({ nodeId, nodeType, hasIncoming }) {
  const addBranch = useTreeStore((s) => s.addBranch);
  const removeNode = useTreeStore((s) => s.removeNode);
  const swapNodeType = useTreeStore((s) => s.swapNodeType);
  const toggleEdgesCost = useTreeStore((s) => s.toggleEdgesCost);
  
  // Zbieramy informacje o aktualnym węźle i jego krawędziach
  const edges = useTreeStore((s) => s.edges);
  const outgoingEdges = edges.filter((e) => e.source === nodeId);
  
  // Sprawdzamy stan globalny: jeśli PRZYNAJMNIEJ JEDNA krawędź ma showCost === true, 
  // traktujemy całą grupę jako "rozwiniętą"
  const areCostsVisible = outgoingEdges.some((e) => e.data?.showCost === true);

  const isTerminal = nodeType === 'terminal';

  const btnClass = "flex w-full items-center gap-2.5 px-3 py-1.5 text-left font-sans text-[12px] font-medium text-slate-700 hover:bg-slate-50 hover:text-cyan-600 transition-colors";
  const iconClass = "h-[15px] w-[15px] shrink-0";
  const dividerClass = "mx-2 my-0.5 h-px bg-slate-100";

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl w-48 py-1 z-50 relative">
      
      {/* SEKCJA: DODAWANIE (ukryta dla terminali) */}
      {!isTerminal && (
        <>
          <button className={btnClass} onClick={() => addBranch(nodeId, 'chance')}>
            <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
            </svg>
            Dodaj niepewność
          </button>
          
          <button className={btnClass} onClick={() => addBranch(nodeId, 'decision')}>
            <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
            Dodaj decyzję
          </button>
          
          <button className={btnClass} onClick={() => addBranch(nodeId, 'terminal')}>
            <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12,3 21,19 3,19" />
            </svg>
            Dodaj konsekwencję
          </button>

          <div className={dividerClass} />
        </>
      )}

      {/* SEKCJA: ZAMIANA TYPU */}
      {nodeType !== 'chance' && (
        <button className={btnClass} onClick={() => swapNodeType(nodeId, 'chance')}>
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Zamień na niepewność
        </button>
      )}

      {nodeType !== 'decision' && (
        <button className={btnClass} onClick={() => swapNodeType(nodeId, 'decision')}>
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Zamień na decyzję
        </button>
      )}

      {nodeType !== 'terminal' && (
        <button className={btnClass} onClick={() => swapNodeType(nodeId, 'terminal')}>
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Zamień na konsekwencję
        </button>
      )}

      {/* SEKCJA: KOSZTY I USUWANIE */}
      {!isTerminal && (
        <>
          <div className={dividerClass} />
          <button 
            className={`${btnClass} text-emerald-600 hover:bg-emerald-50`} 
            onClick={() => toggleEdgesCost(nodeId)}
          >
            {/* Warunkowe renderowanie ikony (otwarte / przekreślone oko) */}
            {areCostsVisible ? (
              <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
            
            {/* Warunkowy tekst */}
            {areCostsVisible ? 'Ukryj koszty / zysk' : 'Pokaż koszty / zysk'}
          </button>
        </>
      )}

      {hasIncoming && (
        <>
          <div className={dividerClass} />
          <button className={`${btnClass} !text-red-600 hover:!bg-red-50`} onClick={() => removeNode(nodeId)}>
            <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
            </svg>
            Usuń {isTerminal ? 'wynik' : 'gałąź'}
          </button>
        </>
      )}
      
    </div>
  );
}