import { useTreeStore } from '../store/useTreeStore.js';

export function NodeMenu({ nodeId, nodeType, hasIncoming }) {
  const addBranch = useTreeStore((s) => s.addBranch);
  const removeNode = useTreeStore((s) => s.removeNode);
  const swapNodeType = useTreeStore((s) => s.swapNodeType);

  const isTerminal = nodeType === 'terminal';

  // Style dla elementów
  const btnClass = "flex w-full items-center gap-3 px-3 py-2 text-left font-sans text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-cyan-600 transition-colors";
  const iconClass = "h-[16px] w-[16px] shrink-0";
  const dividerClass = "mx-2 my-1 h-px bg-slate-100";

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl w-56 py-1.5 !z-[9999] relative">
      
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

      {/* SEKCJA: USUWANIE (widoczne dla wszystkich oprócz głównego korzenia) */}
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