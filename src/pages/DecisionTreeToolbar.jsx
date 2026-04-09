import React, { useRef } from 'react';
import { useTreeStore } from '../store/useTreeStore.js';
import { Save, FileText, FolderOpen } from 'lucide-react';

export function DecisionTreeToolbar({ showTemplates, setShowTemplates }) {
  const fileInputRef = useRef(null);
  
  // Z drzewa potrzebujemy loadScenario do wczytywania
  const loadScenario = useTreeStore(s => s.loadScenario);

  // Identyczne style przycisków jak w TradeoffToolbar
  const btnBase = "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium bg-muted hover:bg-muted/80 text-foreground";

  // --- ZAPIS DO JSON ---
  const handleExportJson = () => {
    const state = useTreeStore.getState();
    const exportData = {
      type: "DecisionTree",
      nodes: state.nodes,
      edges: state.edges,
      labels: state.labels
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

  // --- WCZYTYWANIE Z JSON ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target.result);
        
        // Walidacja czy to na pewno plik z drzewem
        if (parsedData.nodes && parsedData.edges) {
          // UWAGA: Twoje loadScenario w drzewie przyjmuje 3 argumenty!
          loadScenario(parsedData.nodes, parsedData.edges, parsedData.labels || {});
        } else {
          alert("To nie wygląda na poprawny plik Drzewa Decyzyjnego.");
        }
      } catch (error) {
        alert("Błąd odczytu pliku. Upewnij się, że to plik .json.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="flex gap-3 shrink-0 flex-wrap justify-end relative z-20">
      
      {/* Ukryty input pliku */}
      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* 1. SZABLONY */}
      <button
        onClick={() => setShowTemplates(!showTemplates)}
        className={btnBase}
      >
        <FileText className="w-4 h-4" />
        Przykłady
      </button>

      {/* 2. WCZYTAJ PLIK */}
      <button onClick={handleImportClick} className={btnBase}>
        <FolderOpen className="w-4 h-4" />
        Wczytaj
      </button>

      {/* 3. ZAPISZ PLIK */}
      <button onClick={handleExportJson} className={btnBase}>
        <Save className="w-4 h-4" />
        Zapisz drzewo
      </button>

    </div>
  );
}