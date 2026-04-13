import { useReactFlow, Panel } from '@xyflow/react';

export function CustomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel position="bottom-left" className="m-4 hide-on-export">
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card/90 p-1.5 shadow-sm backdrop-blur-sm" >
        
        <button
          onClick={() => zoomIn({ duration: 300 })}
          title="Przybliż"
          className="flex h-8 w-8 items-center justify-center rounded bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        <button
          onClick={() => zoomOut({ duration: 300 })}
          title="Oddal"
          className="flex h-8 w-8 items-center justify-center rounded bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>

        <button
          onClick={() => fitView({ duration: 300 })}
          title="Dopasuj do ekranu"
          className="flex h-8 w-8 items-center justify-center rounded bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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