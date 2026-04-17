import { useTreeStore } from '../store/useTreeStore.js';
import { Circle, Square, Triangle, ArrowRightLeft, Eye, EyeOff, Trash2 } from 'lucide-react';

export function NodeMenu({ nodeId, nodeType, hasIncoming }) {
  const addBranch = useTreeStore((s) => s.addBranch);
  const removeNode = useTreeStore((s) => s.removeNode);
  const swapNodeType = useTreeStore((s) => s.swapNodeType);
  const toggleEdgesCost = useTreeStore((s) => s.toggleEdgesCost);
  
  const edges = useTreeStore((s) => s.edges);
  const outgoingEdges = edges.filter((e) => e.source === nodeId);
  
  const areCostsVisible = outgoingEdges.some((e) => e.data?.showCost === true);

  const isTerminal = nodeType === 'terminal';

  const btnClass = "flex w-full items-center gap-2.5 px-3 py-1.5 text-left font-sans text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors";
  const iconClass = "w-[15px] h-[15px] shrink-0";
  const dividerClass = "mx-2 my-0.5 h-px bg-border";

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xl w-48 py-1 z-50 relative">
      
      {!isTerminal && (
        <>
          <button className={btnClass} onClick={() => addBranch(nodeId, 'chance')}>
            <Circle className={iconClass} />
            Dodaj niepewność
          </button>
          
          <button className={btnClass} onClick={() => addBranch(nodeId, 'decision')}>
            <Square className={iconClass} />
            Dodaj decyzję
          </button>
          
          <button className={btnClass} onClick={() => addBranch(nodeId, 'terminal')}>
            <Triangle className={`${iconClass} rotate-90`} />
            Dodaj konsekwencję
          </button>

          <div className={dividerClass} />
        </>
      )}

      {nodeType !== 'chance' && (
        <button className={btnClass} onClick={() => swapNodeType(nodeId, 'chance')}>
          <ArrowRightLeft className={iconClass} />
          Zamień na niepewność
        </button>
      )}

      {nodeType !== 'decision' && (
        <button className={btnClass} onClick={() => swapNodeType(nodeId, 'decision')}>
          <ArrowRightLeft className={iconClass} />
          Zamień na decyzję
        </button>
      )}

      {nodeType !== 'terminal' && (
        <button className={btnClass} onClick={() => swapNodeType(nodeId, 'terminal')}>
          <ArrowRightLeft className={iconClass} />
          Zamień na konsekwencję
        </button>
      )}

      {!isTerminal && (
        <>
          <div className={dividerClass} />
          <button 
            className={`${btnClass} !text-emerald-600 dark:!text-emerald-400 hover:!bg-emerald-50 dark:hover:!bg-emerald-950/30`} 
            onClick={() => toggleEdgesCost(nodeId)}
          >
            {areCostsVisible ? <EyeOff className={iconClass} /> : <Eye className={iconClass} />}
            {areCostsVisible ? 'Ukryj koszty / zysk' : 'Pokaż koszty / zysk'}
          </button>
        </>
      )}

      {hasIncoming && (
        <>
          <div className={dividerClass} />
          <button className={`${btnClass} !text-destructive hover:!bg-destructive/10`} onClick={() => removeNode(nodeId)}>
            <Trash2 className={iconClass} />
            Usuń {isTerminal ? 'wynik' : 'gałąź'}
          </button>
        </>
      )}
      
    </div>
  );
}