import { useReactFlow, Panel } from '@xyflow/react';

export function CustomControls() {
 
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    
    <Panel position="bottom-left" className="m-4">
      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white/90 p-1.5 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90">
        
        {/* Przycisk Zoom In */}
        <button
          onClick={() => zoomIn({ duration: 300 })}
          title="Przybliż"
          className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-cyan-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-cyan-400"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        {/* Przycisk Zoom Out */}
        <button
          onClick={() => zoomOut({ duration: 300 })}
          title="Oddal"
          className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-cyan-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-cyan-400"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        {/* Przycisk Fit View */}
        <button
          onClick={() => fitView({ duration: 300 })}
          title="Dopasuj do ekranu"
          className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-cyan-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:hover:text-cyan-400"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5 9 2 9 2 2 9 2 9 5"></polyline>
            <polyline points="9 22 9 19 2 19 2 15 5 15"></polyline>
            <polyline points="19 15 22 15 22 22 15 22 15 19"></polyline>
            <polyline points="15 5 15 2 22 2 22 9 19 9"></polyline>
          </svg>
        </button>
        
      </div>
    </Panel>
  );
}