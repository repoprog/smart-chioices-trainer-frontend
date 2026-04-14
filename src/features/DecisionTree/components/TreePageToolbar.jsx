import React, { useRef } from 'react';
import { useTreeStore } from '../store/useTreeStore.js';
import { Save, FileText, FolderOpen } from 'lucide-react';
import { Button } from '../../../components/ui/Button'; 

export function TreePageToolbar({ showTemplates, setShowTemplates }) {
  const fileInputRef = useRef(null);
  
  const loadScenario = useTreeStore(s => s.loadScenario);

  // --- ZAPIS DO JSON ---
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

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target.result);
        
        if (parsedData.nodes && parsedData.edges) {
          loadScenario(parsedData.nodes, parsedData.edges, parsedData.labels || []);
        } else {
          alert("To nie wygląda na poprawny plik Drzewa Decyzyjnej.");
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
      
      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      <Button variant="secondary" onClick={() => setShowTemplates(!showTemplates)}>
        <FileText className="w-4 h-4 mr-2" />
        Przykłady
      </Button>

      <Button variant="secondary" onClick={handleImportClick}>
        <FolderOpen className="w-4 h-4 mr-2" />
        Wczytaj
      </Button>

      <Button variant="secondary" onClick={handleExportJson}>
        <Save className="w-4 h-4 mr-2" />
        Zapisz drzewo
      </Button>

    </div>
  );
}