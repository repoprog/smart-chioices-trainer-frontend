import { useState, useEffect, useRef } from 'react';
import { useReactFlow, getNodesBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useTreeStore, useTemporalTreeStore } from '../store/useTreeStore.js';

export function TreeToolbar() {
  const undo = useTemporalTreeStore((state) => state.undo);
  const redo = useTemporalTreeStore((state) => state.redo);
  const pastStates = useTemporalTreeStore((state) => state.pastStates);
  const futureStates = useTemporalTreeStore((state) => state.futureStates);

  // Dodane akcje do obsługi JSON
  const exportJson = useTreeStore((state) => state.exportJson);
  const importJson = useTreeStore((state) => state.importJson);

  const { getNodes, setViewport, getViewport } = useReactFlow();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef(null);

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const btnClass = "flex h-8 w-8 relative items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 transition-colors";

  const toggleFullscreen = () => {
    const canvasContainer = document.getElementById('tree-canvas-container');
    if (!canvasContainer) return;

    if (!document.fullscreenElement) {
      canvasContainer.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleExportJson = () => {
    const data = exportJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drzewo-decyzyjne.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        importJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportGraph = async (format) => {
    const nodes = getNodes();
    if (nodes.length === 0) {
      alert("Plansza jest pusta. Brak danych do eksportu.");
      return;
    }

    const paddingX = 100;      
    const paddingTop = 180;    
    const paddingBottom = 100; 

    const nodesBounds = getNodesBounds(nodes);
    
    const imageWidth = nodesBounds.width + paddingX * 2;
    const imageHeight = nodesBounds.height + paddingTop + paddingBottom;

    const flowWrapper = document.querySelector('.react-flow');
    if (!flowWrapper) return;

    const currentViewport = getViewport(); 
    const origWidth = flowWrapper.style.width;
    const origHeight = flowWrapper.style.height;

    const bgElement = document.querySelector('.react-flow__background');
    const origBgDisplay = bgElement ? bgElement.style.display : '';
    if (bgElement) bgElement.style.display = 'none';

    try {
      flowWrapper.style.width = `${imageWidth}px`;
      flowWrapper.style.height = `${imageHeight}px`;

      setViewport({ 
        x: -nodesBounds.x + paddingX, 
        y: -nodesBounds.y + paddingTop, 
        zoom: 1 
      });

      // --- OPCJA ATOMOWA: Wstrzykujemy tymczasowy, bezwzględny CSS ---
      const exportStyles = document.createElement('style');
      exportStyles.innerHTML = `
        
        .react-flow * {
          transition: none !important;
        }
       
        input[placeholder^="Etap"], input[placeholder="Konsekwencje"] {
          color: #1e293b !important;
        }
        
        button[title^="Zmień na poszukiwanie"] {
          background-color: #ecfdf5 !important;
          border-color: #34d399 !important;
          color: #065f46 !important;
        }
        button[title^="Zmień na poszukiwanie"] span {
          color: #059669 !important;
        }
      `;
      document.head.appendChild(exportStyles);

     
      await new Promise((resolve) => setTimeout(resolve, 50));

      const dataUrl = await toPng(flowWrapper, {
        backgroundColor: '#ffffff', 
        width: imageWidth,
        height: imageHeight,
        pixelRatio: 2, 
        filter: (node) => {
          if (node?.classList?.contains('tree-toolbar-export')) return false;
          if (node?.classList?.contains('react-flow__controls')) return false;
          if (node?.classList?.contains('react-flow__minimap')) return false;
          if (node?.classList?.contains('hide-on-export')) return false;
          return true;
        }
      });

      document.head.removeChild(exportStyles);

      

      flowWrapper.style.width = origWidth;
      flowWrapper.style.height = origHeight;
      setViewport(currentViewport);
      if (bgElement) bgElement.style.display = origBgDisplay;

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = 'drzewo-decyzyjne.png';
        link.href = dataUrl;
        link.click();
      } else if (format === 'pdf') {
        const pdf = new jsPDF({
          orientation: imageWidth > imageHeight ? 'landscape' : 'portrait',
          unit: 'px',
          format: [imageWidth, imageHeight]
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, imageWidth, imageHeight);
        pdf.save('drzewo-decyzyjne.pdf');
      }
    } catch (err) {
      console.error("Błąd podczas eksportu:", err);
      flowWrapper.style.width = origWidth;
      flowWrapper.style.height = origHeight;
      setViewport(currentViewport);
      if (bgElement) bgElement.style.display = origBgDisplay;
    }
  };

  return (
    <div className="tree-toolbar-export absolute top-3 left-3 z-10 flex items-center gap-1 rounded border border-slate-300 bg-white/95 p-1 shadow-sm backdrop-blur-sm dark:border-slate-600 dark:bg-slate-900/95">
      
      <button onClick={() => undo()} disabled={!canUndo} title="Cofnij (Ctrl+Z)" className={btnClass}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
      </button>
      
      <button onClick={() => redo()} disabled={!canRedo} title="Ponów (Ctrl+Y)" className={btnClass}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" /></svg>
      </button>

      <div className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-700" />

      <button onClick={toggleFullscreen} title={isFullscreen ? "Zamknij pełny ekran" : "Pełny ekran (F11)"} className={btnClass}>
        {isFullscreen ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
        )}
      </button>

      <div className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-700" />

      {/* Ukryty input do ładowania pliku JSON */}
      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
      />

      <button onClick={handleImportClick} title="Wczytaj projekt z pliku (JSON)" className={btnClass}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 14 1.5-3A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.5 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
        </svg>
        <span className="absolute -top-1 -right-1 text-[8px] font-bold text-emerald-600">IN</span>
      </button>

      <button onClick={handleExportJson} title="Zapisz projekt jako plik (JSON)" className={btnClass}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        <span className="absolute -top-1 -right-1 text-[8px] font-bold text-amber-500">JSON</span>
      </button>
      <div className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-700" />

      <button onClick={() => exportGraph('png')} title="Pobierz jako obraz (PNG)" className={btnClass}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
        <span className="absolute -top-1 -right-1 text-[8px] font-bold text-sky-600">PNG</span>
      </button>
      
      <button onClick={() => exportGraph('pdf')} title="Pobierz jako dokument (PDF)" className={btnClass}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        <span className="absolute -top-1 -right-1 text-[8px] font-bold text-red-500">PDF</span>
      </button>
    </div>
  );
}