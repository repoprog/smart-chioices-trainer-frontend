import { useState, useEffect, useCallback } from 'react';
import { useReactFlow, getNodesBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useTreeStore, useTemporalTreeStore } from '../store/useTreeStore.js';

import { FolderOpen, Save, Image as ImageIcon, FileText, Undo2, Redo2, Maximize, Minimize, Share2 } from 'lucide-react'; 

import { Button } from '../../../components/ui/Button'; 
import { useJsonExportImport } from '../../../hooks/useJsonExportImport';

import { useToastStore } from '../../../store/useToastStore';

import { ShareModal } from '../../../components/modals/ShareModal.jsx';


import { exportGraph } from '../logic/treeExportUtils.js';

export function TreeToolbar() {
  const undo = useTemporalTreeStore((state) => state.undo);
  const redo = useTemporalTreeStore((state) => state.redo);
  const pastStates = useTemporalTreeStore((state) => state.pastStates);
  const futureStates = useTemporalTreeStore((state) => state.futureStates);
  

  const addToast = useToastStore((s) => s.addToast);
  
  
  const isPreviewMode = useTreeStore((s) => s.isPreviewMode); 
  // ZMIANA: Pobieramy currentProjectId ze store'a, żeby wiedzieć, czy projekt jest zapisany w chmurze
  const currentProjectId = useTreeStore((s) => s.currentProjectId);
  const importJson = useTreeStore((state) => state.importJson);

  const { getNodes, setViewport, getViewport } = useReactFlow();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // ZMIANA: Stan sterujący otwieraniem/zamykaniem okna udostępniania
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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

  // DODANE: Prosty handler wywołujący naszą wydzieloną logikę eksportu
  const handleImageExport = (format) => {
    exportGraph({ format, getNodes, getNodesBounds, getViewport, setViewport, addToast });
   };

  return (
    // ZMIANA: Otaczamy całość w <>, aby móc wyrenderować Modal obok Toolbara
    <>
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

        {/* --- NOWY PRZYCISK UDOSTĘPNIANIA --- */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => {
        
          if (!currentProjectId) {
            addToast("Aby udostępnić projekt, musisz najpierw zapisać go w chmurze.", "warning");
            return;
          }
        
          setIsShareModalOpen(true);
        }} 
        disabled={isPreviewMode} 
        title="Udostępnij projekt jako link (Read-Only)"
      >
        <Share2 className="w-[18px] h-[18px] text-muted-foreground" />
      </Button>
      <div className="mx-1.5 h-5 w-px bg-border" />

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleImageExport('png')} 
        title="Pobierz jako obraz (PNG)"
      >
        <ImageIcon className="w-[18px] h-[18px] text-muted-foreground" />
      </Button>
      
      {/* PRZYCISK PDF - czysty, bez badge'a */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleImageExport('pdf')} 
        title="Pobierz jako dokument (PDF)"
      >
        <FileText className="w-[18px] h-[18px] text-muted-foreground" />
      </Button>
    </div>
    
      {/* ZMIANA: Modal wyciągnięty na zewnątrz absolutnie pozycjonowanego Toolbara */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        projectId={currentProjectId} 
      />
    </>
  );
}