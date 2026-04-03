export function FloatingToolbar({
  positionClass,
  title,
  onCopy,
  onPaste,
  onDelete,
}) {
  return (
    <div
      className={`absolute right-0 flex z-[9999]" items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${positionClass} `} 
    >
      <button
        onClick={onCopy}
        onPointerDown={(e) => e.stopPropagation()}
        title={`Kopiuj ${title}`}
        className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-cyan-400 transition-colors shadow-sm"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
      <button
        onClick={onPaste}
        onPointerDown={(e) => e.stopPropagation()}
        title={`Wklej ${title}`}
        className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-emerald-400 transition-colors shadow-sm"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      </button>
      <button
        onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()}
        title={`Usuń ${title}`}
        className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-colors shadow-sm"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}