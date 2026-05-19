import { useState, useEffect, useCallback } from 'react';
import { useReactFlow, getNodesBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useTreeStore, useTemporalTreeStore } from '../store/useTreeStore.js';
import { FolderOpen, Save, Image as ImageIcon, FileText, Undo2, Redo2, Maximize, Minimize } from 'lucide-react'; 

import { Button } from '../../../components/ui/Button'; 
import { useJsonExportImport } from '../../../hooks/useJsonExportImport';
// IMPORTUJEMY STORE ZAMIAST KOMPONENTU TOAST
import { useToastStore } from '../../../store/useToastStore';

export function TreeToolbar() {
  const undo = useTemporalTreeStore((state) => state.undo);
  const redo = useTemporalTreeStore((state) => state.redo);
  const pastStates = useTemporalTreeStore((state) => state.pastStates);
  const futureStates = useTemporalTreeStore((state) => state.futureStates);
  

  const addToast = useToastStore((s) => s.addToast);
  
  
  const isPreviewMode = useTreeStore((s) => s.isPreviewMode); 
  const importJson = useTreeStore((state) => state.importJson);

  const { getNodes, setViewport, getViewport } = useReactFlow();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  // --- UNDO/REDO LOGIC ---
  const handleUndo = useCallback(() => {
    if (useTreeStore.getState().isPreviewMode) return; 
    undo();
    // Używamy callbacka, żeby upewnić się, że podbijamy nową wersję
    useTreeStore.setState((state) => ({ 
      isDirty: true, 
      dataVersion: state.dataVersion + 1 
    }));
  }, [undo]);

  const handleRedo = useCallback(() => {
    if (useTreeStore.getState().isPreviewMode) return; 
    redo();
    useTreeStore.setState((state) => ({ 
      isDirty: true, 
      dataVersion: state.dataVersion + 1 
    }));
  }, [redo]);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (useTreeStore.getState().isPreviewMode) return; 

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          if (canRedo) handleRedo();
        } else {
          e.preventDefault();
          if (canUndo) handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, canUndo, canRedo]);
 

  const badgeClass = "absolute -bottom-1.5 right-0 rounded-[4px] bg-background border border-border px-[3px] py-[1px] text-[8px] font-bold text-muted-foreground shadow-sm leading-none z-10 pointer-events-none";

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

  // --- IMPORT/EXPORT LOGIC ---
  const { fileInputRef, handleExport, handleImportClick, handleFileChange } = useJsonExportImport({
    filename: "drzewo-decyzyjne.json",
    buildExportData: () => {
      const state = useTreeStore.getState();
      return {
        type: "DecisionTree",
        nodes: state.nodes,
        edges: state.edges,
        labels: state.stageColumnLabels || [] 
      };
    },
    onImport: (parsedData) => {
      if (useTreeStore.getState().isPreviewMode) return; 
      
      // Prosta walidacja (tak jak w Tabeli)
      if (parsedData.nodes && parsedData.edges) {
          importJson(JSON.stringify(parsedData));
           addToast("Drzewo zostało wczytane poprawnie.", "success");
      } else {
     
          addToast("To nie wygląda na poprawny plik Drzewa Decyzyjnego.", "error");
      }
    },
  
    onError: (msg) => addToast(msg, "error") 
  });

  const exportGraph = async (format) => {
     const nodes = getNodes();
     if (nodes.length === 0) {
       addToast("Plansza jest pusta. Brak danych do eksportu.", "warning");
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
       exportStyles.id = 'react-flow-export-style';
       exportStyles.innerHTML = `
         .react-flow * {
           transition: none !important;
         }
         
         .hide-on-export-img { display: none !important; }
         .show-on-export-img { display: block !important; }
         
         /* ---> NOWE: NAPRAWA LEGENDY <--- */
         .export-force-light-legend {
           background-color: #ffffff !important; 
           backdrop-filter: none !important; 
           border-color: #e2e8f0 !important; 
           color: #64748b !important; 
         }
         
         .export-force-light-legend svg {
           color: #0f172a !important; 
           fill: #ffffff !important; 
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
      
      <Button variant="ghost" size="icon" onClick={handleUndo} disabled={!canUndo || isPreviewMode} title="Cofnij (Ctrl+Z)">
        <Undo2 className="w-[18px] h-[18px]" />
      </Button>
      
      <Button variant="ghost" size="icon" onClick={handleRedo} disabled={!canRedo || isPreviewMode} title="Ponów (Ctrl+Y)">
        <Redo2 className="w-[18px] h-[18px]" />
      </Button>

      <div className="mx-1.5 h-5 w-px bg-border" />

      <Button variant="ghost" size="icon" onClick={toggleFullscreen} title={isFullscreen ? "Zamknij pełny ekran" : "Pełny ekran (F11)"}>
        {isFullscreen ? <Minimize className="w-[18px] h-[18px]" /> : <Maximize className="w-[18px] h-[18px]" />}
      </Button>

      <div className="mx-1.5 h-5 w-px bg-border" />

      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
      />

      {/* POPRAWKA: Zabezpieczenie onClick na imporcie (gdyby komponent Button puszczał kliknięcia pomimo disabled) */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={(e) => {
          if (isPreviewMode) return;
          handleImportClick(e);
        }} 
        disabled={isPreviewMode}
        title="Wczytaj decyzje z pliku (JSON)"
      >
        <FolderOpen className="w-[18px] h-[18px] text-muted-foreground" />
      </Button>

      <Button variant="ghost" size="icon" onClick={handleExport} title="Zapisz decyzję jako plik (JSON)">
        <Save className="w-[18px] h-[18px] text-muted-foreground" />
      </Button>
      
      <div className="mx-1.5 h-5 w-px bg-border" />

      <Button variant="ghost" size="icon" className="relative" onClick={() => exportGraph('png')} title="Pobierz jako obraz (PNG)">
        <ImageIcon className="w-[18px] h-[18px]" />
        <span className={badgeClass}>PNG</span>
      </Button>
      
      <Button variant="ghost" size="icon" className="relative" onClick={() => exportGraph('pdf')} title="Pobierz jako dokument (PDF)">
        <FileText className="w-[18px] h-[18px]" />
        <span className={badgeClass}>PDF</span>
      </Button>
      
    </div>
    
    
  );
}