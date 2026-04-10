import React, { useState, useEffect } from 'react';
import { DecisionTreeCanvas } from '../components/DecisionTreeCanvas.jsx';
import { useTreeStore } from '../store/useTreeStore.js';
import { scenarios } from '../data/scenarios.js'; 
import { DecisionTreeToolbar } from './DecisionTreeToolbar.jsx';
import ConfirmModal from '../components/ConfirmModal'; // UPEWNIJ SIĘ, ŻE ŚCIEŻKA JEST POPRAWNA!

export function DecisionTreePage() {
  const { loadScenario, resetTree, isDirty } = useTreeStore();
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Stany dla Modali Ostrzegawczych
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);

  // ZABEZPIECZENIE PRZED ZAMKNIĘCIEM PRZEGLĄDARKI (F5 / Krzyżyk)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Wymusza natywny komunikat przeglądarki
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // AUTOMATYCZNE ŁADOWANIE Z LINKU
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scenarioKey = params.get('scenario'); 
    if (scenarioKey && scenarios[scenarioKey]) {
      const data = scenarios[scenarioKey];
      loadScenario(data.nodes, data.edges, data.labels);
    }
  }, []);

  // LOGIKA RESETU
  const handleResetClick = () => {
    if (isDirty) {
      setIsResetModalOpen(true);
    } else {
      resetTree();
    }
  };

  // LOGIKA SZABLONÓW
  const handleTemplateClick = (scenarioData) => {
    if (isDirty) {
      setPendingTemplate(scenarioData); // Czekamy na potwierdzenie w modalu
    } else {
      loadScenario(scenarioData.nodes, scenarioData.edges, scenarioData.labels);
      setShowTemplates(false);
    }
  };

  const confirmLoadTemplate = () => {
    if (pendingTemplate) {
      loadScenario(pendingTemplate.nodes, pendingTemplate.edges, pendingTemplate.labels);
      setPendingTemplate(null);
      setShowTemplates(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* NAGŁÓWEK I TOOLBAR */}
      <div className="flex flex-wrap md:flex-nowrap items-start md:items-center justify-between gap-4 relative z-50">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Drzewo decyzyjne</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Kwadrat = decyzja, koło = niepewność. Najedź na węzeł, aby dodać gałąź. Symulacja What-if - odblokuj autobalans prawdopodobieństwa w konkurencyjnych gałęziach (wyżej lub niżej) by sprawdzić jak płynna zmiana prawdopodobieństwa wpływa na wynik opłacalności.
          </p>
        </div>
        
        <DecisionTreeToolbar 
          showTemplates={showTemplates} 
          setShowTemplates={setShowTemplates} 
        />
      </div>

     {/* ROZWIJANE SZABLONY */}
      {showTemplates && (
        <div className="border border-border rounded-lg p-4 bg-muted/20 animate-in fade-in slide-in-from-top-2 relative z-10">
          <h3 className="font-medium mb-3 text-sm text-foreground">Predefiniowane szablony</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(scenarios).map(([key, scenarioData]) => (
              <button
                key={key}
                onClick={() => handleTemplateClick(scenarioData)}
                className="p-4 border border-border rounded-lg bg-card hover:border-primary hover:bg-primary/5 transition-colors text-left shadow-sm group flex flex-col h-full"
              >
                <div className="font-medium mb-1 text-foreground group-hover:text-primary transition-colors">{scenarioData.name}</div>
                <div className="text-xs text-muted-foreground">{scenarioData.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KONTENER CANVASU I RESET */}
      <div className="flex-1 min-h-[600px] border border-border rounded-xl overflow-hidden bg-card shadow-sm relative z-0 flex flex-col">
        <div className="flex-1 relative">
            <DecisionTreeCanvas />
        </div>
        <div className="absolute bottom-4 right-4 z-10">
          <button 
            className="bg-card/80 backdrop-blur border border-border text-destructive/80 text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all shadow-sm"
            onClick={handleResetClick}
          >
            Wyczyść obszar
          </button>
        </div>
      </div>

      {/* MODAL 1: Ostrzeżenie przy resecie */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => {
            resetTree();
            setIsResetModalOpen(false);
        }}
        title="Czyszczenie obszaru"
        message="Czy na pewno chcesz usunąć całe drzewo decyzyjne? Tej akcji nie można cofnąć."
        variant="danger"
        confirmText="Wyczyść drzewo"
      />

      {/* MODAL 2: Ostrzeżenie przy ładowaniu szablonu */}
      <ConfirmModal
        isOpen={pendingTemplate !== null}
        onClose={() => setPendingTemplate(null)}
        onConfirm={confirmLoadTemplate}
        title="Nadpisanie drzewa"
        message="Załadowanie nowego szablonu usunie Twoje obecne drzewo. Czy na pewno chcesz kontynuować?"
        variant="warning"
        confirmText="Załaduj szablon"
      />

    </div>
  );
}