import { useEffect } from 'react';
import { useTemporalTreeStore } from '../store/useTreeStore.js';

export function UndoRedoControls() {
  const undo = useTemporalTreeStore((state) => state.undo);
  const redo = useTemporalTreeStore((state) => state.redo);
  const pastStates = useTemporalTreeStore((state) => state.pastStates);
  const futureStates = useTemporalTreeStore((state) => state.futureStates);

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignoruj, jeśli użytkownik pisze tekst w inputach (żeby nie cofać planszy podczas pisania nagłówków)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          if (canRedo) redo();
        } else {
          e.preventDefault();
          if (canUndo) undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return (
    <div className="flex items-center gap-1 border-l border-slate-300 pl-4 ml-4 dark:border-slate-700">
      <button
        // TUTAJ JEST FIX: pusta funkcja strzałkowa blokuje przesyłanie Eventu Myszki!
        onClick={() => undo()} 
        disabled={!canUndo}
        title="Cofnij (Ctrl+Z)"
        className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
      </button>

      <button
        // TUTAJ JEST FIX
        onClick={() => redo()} 
        disabled={!canRedo}
        title="Ponów (Ctrl+Y)"
        className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
        </svg>
      </button>
    </div>
  );
}