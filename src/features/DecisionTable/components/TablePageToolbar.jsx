import React, { useRef, useState } from 'react';
import { useTableStore } from '../store/useTableStore';
import { Save, FileText, FolderOpen, Scale, Trophy, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button'; 

export function TablePageToolbar({ showTemplates, setShowTemplates }) {
  const showTradeoffs = useTableStore(s => s.showTradeoffs);
  const showRanking = useTableStore(s => s.showRanking);
  const toggleTradeoffs = useTableStore(s => s.toggleTradeoffs);
  const toggleRanking = useTableStore(s => s.toggleRanking);
  const loadScenario = useTableStore(s => s.loadScenario); 
  
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const fileInputRef = useRef(null);


  const handleExportJson = () => {
    const state = useTableStore.getState();
    const exportData = {
      name: "Moja Tabela Decyzyjna",
      description: "Zapisana sesja z aplikacji.",
      alternatives: state.alternatives,
      objectives: state.objectives,
      cells: state.cells,
      objectiveUnits: state.objectiveUnits,
      sortDirections: state.sortDirections
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "tabela-kompromisow.json";
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
        if (parsedData.alternatives && parsedData.objectives && parsedData.cells) {
          loadScenario(parsedData);
        } else {
          alert("To nie wygląda na poprawny plik Tabeli Decyzyjnej.");
        }
      } catch (error) {
        alert("Błąd podczas odczytu pliku. Upewnij się, że to poprawny plik .json.");
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="flex gap-3 shrink-0 flex-wrap justify-end relative">
      
      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      <Button variant="secondary" onClick={() => setShowTemplates(!showTemplates)}>
        <FileText className="w-4 h-4 mr-2" /> Przykłady
      </Button>

      <Button variant="secondary" onClick={handleImportClick}>
        <FolderOpen className="w-4 h-4 mr-2" /> Wczytaj
      </Button>

  
        <div className="relative flex">
        <Button 
          variant={showTradeoffs ? "purple" : "defaultPurple"}
          onClick={toggleTradeoffs}
        >
          <Scale className="w-4 h-4 mr-2" /> Kompromisy
          
          <span 
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current text-[10px] font-bold -translate-y-[1px] ml-1.5 transition-all hover:bg-white hover:text-purple-500"
            onClick={(e) => { e.stopPropagation(); setShowHelpTooltip(!showHelpTooltip); }}
          >
            ?
          </span>
        </Button>
        
       {/* Tooltip */}
        {showHelpTooltip && (
          <div className="absolute top-full right-0 mt-3 w-[380px] bg-card border border-border p-5 rounded-xl shadow-xl z-50 text-sm leading-relaxed text-left cursor-default font-normal text-foreground animate-in fade-in zoom-in-95 duration-200">
            <button 
              className="absolute top-3 right-3 bg-transparent border-none text-muted-foreground w-7 h-7 flex items-center justify-center cursor-pointer rounded-md transition-colors hover:text-foreground hover:bg-muted leading-none text-lg" 
              onClick={(e) => { e.stopPropagation(); setShowHelpTooltip(false); }} 
            > 
              <X className="w-4 h-4" /> 
            </button>
            
            <h3 className="text-base font-bold text-foreground mb-4 pr-6 leading-tight">
              Kompromisy <br/>
             
            </h3>
            
            <div className="mb-4">
                
                <p className="text-muted-foreground text-xs m-0">
                  Polegają na stopniowej eliminacji celów. Jeżeli w jednym z celów wartości są takie same dla każdej alternatywy, ten cel można pominąć - nie wpływa już na decyzję.
                </p>
            </div>

            <div className="mb-5">
                <h4 className="mb-1.5 text-foreground text-[14px] font-semibold flex items-center gap-1.5">
                    Równa wymiana
                </h4>
                <p className="text-muted-foreground text-xs m-0 mb-2">
                  Wybierz łatwy cel, np. czas dojazdu. Znajdź w tabeli alternatywę z najlepszym czasem i zastanów się, o ile musiałbyś zwiększyć inny cel (np. czynsz) w pozostałych alternatywach, aby wyrównać w nich czas do tego poziomu. Np. każde 10 min mniej dojazdu zwiększa czynsz o 300zł.
                </p>
                <p className="text-muted-foreground text-xs m-0 mb-3">
                  Wprowadź zmiany, cel zostanie przekreślony — skoro jest równy, nie ma już znaczenia.
                </p>

                <p className="text-foreground text-[13px] font-semibold m-0 mb-1.5">
                  Postępuj tak dla kolejnych, łatwych celów, aż:
                </p>
                <ul className="m-0 pl-5 mb-0 list-disc text-muted-foreground text-xs marker:text-primary">
                    <li className="mb-1">wyłonisz zwycięzcę, albo</li>
                    <li className="mb-1">zostanie tylko jeden cel do porównania.</li>
                </ul>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg border border-border/50 flex gap-2.5 items-start mt-2">
                <span className="text-base leading-none">💡</span>
                <p className="m-0 text-xs text-muted-foreground italic">
                  Najprościej wyrównywać atrybuty (np. czas, standard, kolor), a zmieniać kwoty.
                </p>
            </div>
          </div> 
        )}
      </div>

      <Button 
       variant={showRanking ? "amber" : "defaultAmber"}
        onClick={toggleRanking}
      >
        <Trophy className="w-4 h-4 mr-2" /> Ranking
      </Button>

      <Button variant="secondary" onClick={handleExportJson}>
        <Save className="w-4 h-4 mr-2" /> Zapisz 
      </Button>

    </div>
  );
}