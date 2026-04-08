import React, { useState } from 'react';
import { DecisionTreeCanvas } from '../components/DecisionTreeCanvas.jsx';
import { useTreeStore } from '../store/useTreeStore.js';
import { scenarios } from '../data/scenarios.js'; 
import { Plus, Save, FileText, Network } from 'lucide-react';

export function DecisionTreePage() {
  // Wyciągamy funkcję ładującą ze store'a
  const loadScenario = useTreeStore((s) => s.loadScenario);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleLoadTemplate = (scenarioData) => {
    loadScenario(scenarioData.nodes, scenarioData.edges, scenarioData.labels);
    setShowTemplates(false);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* 1. NOWY HEADER (Z DESIGNU FIGMY) */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Drzewo decyzyjne</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Kwadrat = decyzja, koło = niepewność. Najedź na węzeł, aby dodać gałąź.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            Szablony
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors text-sm font-medium shadow-sm">
            <Save className="w-4 h-4" />
            Zapisz drzewo
          </button>
        </div>
      </div>

      {/* 2. ROZWIJANE SZABLONY (POŁĄCZONE Z TWOJĄ LOGIKĄ) */}
      {showTemplates && (
        <div className="border border-border rounded-lg p-4 bg-muted/20 animate-in fade-in slide-in-from-top-2">
          <h3 className="font-medium mb-3 text-sm text-foreground">Predefiniowane szablony</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(scenarios).map(([key, scenarioData]) => (
              <button
                key={key}
                onClick={() => handleLoadTemplate(scenarioData)}
                className="p-4 border border-border rounded-lg bg-card hover:border-primary hover:bg-primary/5 transition-colors text-left shadow-sm"
              >
                <div className="font-medium mb-1 text-foreground">{scenarioData.name}</div>
                <div className="text-xs text-muted-foreground">Wczytaj gotowy układ węzłów i szans.</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. KONTENER CANVASU - NAPRAWA WYŚWIETLANIA */}
      {/* Dodaliśmy min-h-[600px] i flex-1, żeby React Flow wiedziało, na jakiej przestrzeni ma się rysować */}
      <div className="flex-1 min-h-[600px] border border-border rounded-xl overflow-hidden bg-card shadow-sm relative">
        <DecisionTreeCanvas />
      </div>

    </div>
  );
}