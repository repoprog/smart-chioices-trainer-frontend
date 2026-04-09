import React, { useRef, useState } from 'react';
import { useTradeoffStore } from '../../store/useTradeOffStore';
import { Save, FileText, FolderOpen, Scale, Trophy } from 'lucide-react';

export function TradeoffToolbar({ showTemplates, setShowTemplates }) {
  // Stany i akcje ze store'a
  const showTradeoffs = useTradeoffStore(s => s.showTradeoffs);
  const showRanking = useTradeoffStore(s => s.showRanking);
  const toggleTradeoffs = useTradeoffStore(s => s.toggleTradeoffs);
  const toggleRanking = useTradeoffStore(s => s.toggleRanking);
  const loadScenario = useTradeoffStore(s => s.loadScenario); // Potrzebne do wczytania pliku
  
  // Stan UI
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  
  // Referencja do ukrytego inputu file
  const fileInputRef = useRef(null);

  // BAZA STYLÓW (Nietknięta)
  const btnBase = "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium";

  // ==========================================
  // LOGIKA ZAPISU DO JSON
  // ==========================================
  const handleExportJson = () => {
    // Pobieramy całą aktualną zawartość tabeli prosto ze store'a
    const state = useTradeoffStore.getState();
    
    // Budujemy obiekt zgodny z formatem Twoich szablonów
    const exportData = {
      name: "Moja Tabela Decyzyjna",
      description: "Zapisana sesja z aplikacji.",
      alternatives: state.alternatives,
      objectives: state.objectives,
      cells: state.cells,
      objectiveUnits: state.objectiveUnits,
      sortDirections: state.sortDirections
    };

    // Zamieniamy obiekt na ładny string JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    
    // Tworzymy wirtualny plik (Blob) i link do jego pobrania
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "tabela-kompromisow.json";
    document.body.appendChild(link);
    link.click();
    
    // Sprzątamy po sobie
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // LOGIKA WCZYTYWANIA Z JSON
  // ==========================================
  const handleImportClick = () => {
    // Symulujemy kliknięcie w ukryty input
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target.result);
        
        // Prosta walidacja, czy to na pewno nasz plik tabeli
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
    // Czyścimy input, żeby można było wczytać ten sam plik drugi raz pod rząd
    event.target.value = '';
  };

  return (
    <div className="flex gap-3 shrink-0 flex-wrap justify-end relative">
      
      {/* UKRYTY INPUT DO WCZYTYWANIA PLIKÓW */}
      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* SZABLONY */}
      <button
        onClick={() => setShowTemplates(!showTemplates)}
        className={`${btnBase} bg-muted hover:bg-muted/80 text-foreground`}
      >
        <FileText className="w-4 h-4" />
        Przykłady
      </button>

      {/* WCZYTAJ Z PODPIĘTĄ LOGIKĄ */}
      <button
        onClick={handleImportClick}
        className={`${btnBase} bg-muted hover:bg-muted/80 text-foreground`}
      >
        <FolderOpen className="w-4 h-4" />
        Wczytaj
      </button>

      {/* KOMPROMISY */}
      <div className="relative flex">
        <button 
          className={`${btnBase} ${
            showTradeoffs 
              ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-sm' 
              : 'bg-primary text-primary-foreground hover:bg-purple-500 hover:text-white shadow-sm'
          }`}
          onClick={toggleTradeoffs}
        >
          <Scale className="w-4 h-4" />
          Kompromisy
          
          <span 
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current text-current text-[10px] font-bold -translate-y-[1px] ml-1 transition-all hover:bg-white hover:text-purple-500"
            onClick={(e) => { e.stopPropagation(); setShowHelpTooltip(!showHelpTooltip); }}
          >
            ?
          </span>
        </button>
        
        {/* Tooltip */}
        {showHelpTooltip && (
          <div className="absolute top-full right-0 mt-3 w-[380px] bg-gray-800 text-gray-50 p-5 rounded-xl shadow-xl z-50 text-sm leading-relaxed text-left cursor-default font-normal">
            <button className="absolute top-3 right-3 bg-transparent border-none text-gray-400 text-xl cursor-pointer px-2 py-1 rounded transition-colors hover:text-gray-50 hover:bg-white/10 leading-none" onClick={() => setShowHelpTooltip(false)} aria-label="Zamknij">&times;</button>
            <p className="mb-3"><strong>Kompromisy</strong> polegają na "eliminacji celów" przez równą wymianę. Jeżeli w jednym z celów wartości są takie same dla każdej alternatywy, ten cel można pominąć - nie wpływa już na decyzję.</p>
            <h4 className="mt-4 mb-2 text-purple-400 text-sm uppercase tracking-wide font-semibold">Równa wymiana</h4>
            <p className="mb-3">Wybierz łatwy cel, np. czas dojazdu. Znajdź w tabeli alternatywę z najlepszym czasem i zastanów się, o ile musiałbyś zwiększyć inny cel (np. czynsz) w pozostałych alternatywach, aby wyrównać w nich czas do tego poziomu. Np. każde 10 min mniej dojazdu zwiększa czynsz o 300zł.</p>
            <p className="mb-3">Wprowadź zmiany, cel zostanie przekreślony — skoro jest równy, nie ma już znaczenia.</p>
            <p className="mb-3">Postępuj tak dla kolejnych, łatwych celów, aż:</p>
            <ul className="m-0 pl-5 mb-3 list-disc">
                <li className="mb-1">wyłonisz zwycięzcę, albo</li>
                <li className="mb-1">zostanie tylko jeden cel do porównania.</li>
            </ul>
            <p className="m-0">💡<i className="text-gray-300">Najprościej zrównywać atrybuty (np. czas, standard, kolor), a zwiększać kwoty.</i></p>
          </div> 
        )} 
      </div>

      {/* RANKING */}
      <button 
        className={`${btnBase} ${
          showRanking 
            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm' 
            : 'bg-primary text-primary-foreground hover:bg-amber-500 hover:text-white shadow-sm'
        }`}
        onClick={toggleRanking}
      >
        <Trophy className="w-4 h-4" />
        Ranking
      </button>

      {/* ZAPISZ Z PODPIĘTĄ LOGIKĄ */}
      <button 
        onClick={handleExportJson}
        className={`${btnBase} bg-muted hover:bg-muted/80 text-foreground`}
      >
        <Save className="w-4 h-4" />
        Zapisz 
      </button>

    </div>
  );
}