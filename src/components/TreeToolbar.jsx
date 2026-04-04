import { useState, useEffect } from 'react';
import { useReactFlow, getNodesBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useTemporalTreeStore } from '../store/useTreeStore.js';

export function TreeToolbar() {
  const undo = useTemporalTreeStore((state) => state.undo);
  const redo = useTemporalTreeStore((state) => state.redo);
  const pastStates = useTemporalTreeStore((state) => state.pastStates);
  const futureStates = useTemporalTreeStore((state) => state.futureStates);

  const { getNodes, setViewport, getViewport } = useReactFlow();

  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const exportGraph = async (format) => {
    const nodes = getNodes();
    if (nodes.length === 0) {
      alert("Plansza jest pusta. Brak danych do eksportu.");
      return;
    }

    // --- ZMIANA 1: Asymetryczne marginesy ---
    const paddingX = 100;      // Margines po bokach
    const paddingTop = 180;    // Dużo miejsca na górze na nagłówki! (Zepchnie drzewo w dół)
    const paddingBottom = 100; // Margines na dole

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

      // --- ZMIANA 2: Uwzględnienie paddingTop w kamerze ---
      setViewport({ 
        x: -nodesBounds.x + paddingX, 
        y: -nodesBounds.y + paddingTop, 
        zoom: 1 
      });

      // Zwiększyłem czas oczekiwania do 150ms, żeby mieć pewność, że DOM przerysuje nagłówki
      await new Promise((resolve) => setTimeout(resolve, 150));

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

      <button onClick={() => exportGraph('png')} title="Pobierz jako obraz (PNG)" className={btnClass}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        <span className="absolute -top-1 -right-1 text-[8px] font-bold text-sky-600">PNG</span>
      </button>
      
      <button onClick={() => exportGraph('pdf')} title="Pobierz jako dokument (PDF)" className={btnClass}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
        <span className="absolute -top-1 -right-1 text-[8px] font-bold text-red-500">PDF</span>
      </button>
    </div>
  );
}