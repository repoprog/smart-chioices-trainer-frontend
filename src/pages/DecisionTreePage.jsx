import React, { useState, useEffect } from 'react';
import { DecisionTreeCanvas } from '../components/DecisionTreeCanvas.jsx';
import { useTreeStore } from '../store/useTreeStore.js';
import { scenarios } from '../data/scenarios.js'; 
import { DecisionTreeToolbar } from './DecisionTreeToolbar.jsx'; // Importujemy nowy Toolbar

export function DecisionTreePage() {
  const loadScenario = useTreeStore((s) => s.loadScenario);
  const [showTemplates, setShowTemplates] = useState(false);

  // AUTOMATYCZNE ŁADOWANIE Z LINKU (np. z Landing Page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scenarioKey = params.get('scenario'); // Sprawdzamy ?scenario=nazwa

    if (scenarioKey && scenarios[scenarioKey]) {
      const data = scenarios[scenarioKey];
      loadScenario(data.nodes, data.edges, data.labels);
    }
  }, []);

  const handleLoadTemplate = (scenarioData) => {
    loadScenario(scenarioData.nodes, scenarioData.edges, scenarioData.labels);
    setShowTemplates(false);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* 1. NAGŁÓWEK I TOOLBAR */}
      <div className="flex flex-wrap md:flex-nowrap items-start md:items-center justify-between gap-4 relative z-50">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Drzewo decyzyjne</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Kwadrat = decyzja, koło = niepewność. Najedź na węzeł, aby dodać gałąź. Symulacja What-if - odblokuj autobalans prawdopodobieństwa w konkurencyjnych gałęziach (wyżej lub niżej) by sprawdzić jak płynna zmiana prawdopodobieństwa wpływa na wynik opłacalności.
          </p>
        </div>
        
        {/* Podpinamy nowy komponent Toolbar */}
        <DecisionTreeToolbar 
          showTemplates={showTemplates} 
          setShowTemplates={setShowTemplates} 
        />
      </div>

     {/* 2. ROZWIJANE SZABLONY */}
      {showTemplates && (
        <div className="border border-border rounded-lg p-4 bg-muted/20 animate-in fade-in slide-in-from-top-2 relative z-10">
          <h3 className="font-medium mb-3 text-sm text-foreground">Predefiniowane szablony</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(scenarios).map(([key, scenarioData]) => (
              <button
                key={key}
                onClick={() => handleLoadTemplate(scenarioData)}
                className="p-4 border border-border rounded-lg bg-card hover:border-primary hover:bg-primary/5 transition-colors text-left shadow-sm group flex flex-col h-full"
              >
                <div className="font-medium mb-1 text-foreground group-hover:text-primary transition-colors">{scenarioData.name}</div>
                {/* TUTAJ JEST POPRAWKA: */}
                <div className="text-xs text-muted-foreground">{scenarioData.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. KONTENER CANVASU */}
      <div className="flex-1 min-h-[600px] border border-border rounded-xl overflow-hidden bg-card shadow-sm relative z-0">
        <DecisionTreeCanvas />
      </div>

    </div>
  );
}