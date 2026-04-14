import { useState, useEffect, useRef } from 'react';
import { useReactFlow, getNodesBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useTreeStore, useTemporalTreeStore } from '../store/useTreeStore.js';
import { FolderOpen, Save, Image as ImageIcon, FileText, Undo2, Redo2, Maximize, Minimize } from 'lucide-react'; 

export function TreeToolbar() {
  const undo = useTemporalTreeStore((state) => state.undo);
  const redo = useTemporalTreeStore((state) => state.redo);
  const pastStates = useTemporalTreeStore((state) => state.pastStates);
  const futureStates = useTemporalTreeStore((state) => state.futureStates);

  const exportJson = useTreeStore((state) => state.exportJson);
  const importJson = useTreeStore((state) => state.importJson);

  const { getNodes, setViewport, getViewport } = useReactFlow();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef(null);

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const btnClass = "flex h-9 w-9 relative items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors";
  // Nowa klasa dla "plakietki" (badge) z nazwą formatu
  const badgeClass = "absolute -bottom-1.5 right-0 rounded-[4px] bg-background border border-border px-[3px] py-[1px] text-[8px] font-bold text-muted-foreground shadow-sm leading-none z-10";

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
    const state = useTreeStore.getState();
    const exportData = {
      type: "DecisionTree",
      nodes: state.nodes,
      edges: state.edges,
      labels: state.stageColumnLabels || [] 
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "drzewo-decyzyjne.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="tree-toolbar-export absolute top-3 left-3 z-10 flex items-center gap-1 rounded-lg border border-border bg-card/95 p-1.5 shadow-sm backdrop-blur-sm">
      
      <button onClick={() => undo()} disabled={!canUndo} title="Cofnij (Ctrl+Z)" className={btnClass}>
        <Undo2 className="w-[18px] h-[18px]" />
      </button>
      
      <button onClick={() => redo()} disabled={!canRedo} title="Ponów (Ctrl+Y)" className={btnClass}>
        <Redo2 className="w-[18px] h-[18px]" />
      </button>

      <div className="mx-1.5 h-5 w-px bg-border" />

      <button onClick={toggleFullscreen} title={isFullscreen ? "Zamknij pełny ekran" : "Pełny ekran (F11)"} className={btnClass}>
        {isFullscreen ? <Minimize className="w-[18px] h-[18px]" /> : <Maximize className="w-[18px] h-[18px]" />}
      </button>

      <div className="mx-1.5 h-5 w-px bg-border" />

      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
      />

      <button onClick={handleImportClick} title="Wczytaj projekt z pliku (JSON)" className={btnClass}>
        <FolderOpen className="w-[18px] h-[18px] text-muted-foreground" />
      </button>

      <button onClick={handleExportJson} title="Zapisz projekt jako plik (JSON)" className={btnClass}>
        <Save className="w-[18px] h-[18px] text-muted-foreground" />
      </button>
      
      <div className="mx-1.5 h-5 w-px bg-border" />

      <button onClick={() => exportGraph('png')} title="Pobierz jako obraz (PNG)" className={btnClass}>
        <ImageIcon className="w-[18px] h-[18px]" />
        <span className={badgeClass}>PNG</span>
      </button>
      
      <button onClick={() => exportGraph('pdf')} title="Pobierz jako dokument (PDF)" className={btnClass}>
        <FileText className="w-[18px] h-[18px]" />
        <span className={badgeClass}>PDF</span>
      </button>
    </div>
  );
}