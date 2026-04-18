import React, { useRef } from 'react';
import { useTreeStore } from '../store/useTreeStore.js';
import { Save, FileText, FolderOpen, SlidersHorizontal , Lock } from 'lucide-react';
import { Button } from '../../../components/ui/Button'; 
import { Tooltip } from '../../../components/ui/Tooltip'; 

export function TreePageToolbar({ showTemplates, setShowTemplates }) {
  const fileInputRef = useRef(null);
  const isSimulationMode = useTreeStore((s) => s.isSimulationMode);
  const toggleSimulationMode = useTreeStore((s) => s.toggleSimulationMode);
  
  const loadScenario = useTreeStore((s) => s.loadScenario);

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
        Zapisz
      </Button>
      <div className="relative flex">
        <Button 
        variant={isSimulationMode ? "cyan" : "defaultCyan"}
       
        onClick={toggleSimulationMode}>
          <SlidersHorizontal className="w-4 h-4 mr-2" /> Symulacja
          
          <Tooltip 
            title="Symulacja „What-if”" 
            subtitle="(Auto-balans)"
            position="bottom-right"
            width="w-[380px]"
            trigger={
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current text-[10px] font-bold -translate-y-[1px] ml-1.5 transition-all hover:bg-white hover:text-cyan-600">
                ?
              </span>
            }
          >
            <div className="mb-4">
              <h4 className="mb-1.5 text-foreground text-[13px] font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Ręczna kontrola
              </h4>
              <p className="text-xs m-0">
                Wpisane prawdopodobieństwa są domyślnie blokowane. Jeśli ich suma przekroczy 100%, aplikacja Cię ostrzeże.
              </p>
            </div>

            <div className="mb-5">
              <h4 className="mb-1.5 text-foreground text-[13px] font-semibold flex items-center gap-1.5">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-cyan-400 text-[13px] font-bold">A</span>
                Auto-balansowanie
              </h4>
              <p className="text-xs m-0">
                Odblokuj kłódki przy gałęziach, aby system przeliczał wartości automatycznie. Zwiększenie jednej szansy proporcjonalnie pomniejszy pozostałe.
              </p>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg border border-border/50 flex gap-2.5 items-start mt-2">
              <span className="text-base leading-none">💡</span>
              <p className="m-0 text-xs italic">
                Zmieniaj wartości i obserwuj na żywo, jak wpływa to na wynik oraz która opcja staje się nowym zwycięzcą.
              </p>
            </div>
          </Tooltip>
        </Button>
      </div>


    </div>
  );
}