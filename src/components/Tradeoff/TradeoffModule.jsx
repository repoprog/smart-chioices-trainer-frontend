import React, { useState, useEffect } from 'react';
import { useTradeoffStore } from '../../store/useTradeOffStore';
import { TradeoffGrid } from './TradeoffGrid';
import { TradeoffSettings } from './TradeoffSettings';
import { tradeoffScenarios } from '../../data/tradeoffScenarios'; 
import { TradeoffToolbar } from './TradeoffToolbar';

export function TradeoffModule() {
  const resetAll = useTradeoffStore(s => s.resetAll);
  const loadScenario = useTradeoffStore(s => s.loadScenario);
  
  // Stany UI dla szablonów (przekazywane do Toolbara)
 const [showTemplates, setShowTemplates] = useState(false);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scenarioKey = params.get('scenario');

    
    if (scenarioKey && tradeoffScenarios[scenarioKey]) {
      loadScenario(tradeoffScenarios[scenarioKey]);
      
    }
  }, []); 

  const handleReset = () => {
    if(window.confirm('Czy na pewno chcesz zresetować całą tabelę?')) {
      resetAll();
    }
  };

  const handleLoadTemplate = (scenarioData) => {
    loadScenario(scenarioData);
    setShowTemplates(false);
  };

  return (
    <div className="w-full h-full flex flex-col font-sans space-y-6">
      
      {/* 1. GŁÓWNY NAGŁÓWEK - Identyczny układ jak w drzewie */}
      <div className="flex flex-wrap md:flex-nowrap items-start md:items-center justify-between gap-4 relative z-50">
        
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Tabela Smart Choices</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Wypisz cele (kryteria) i alternatywy. Uzupełnij wartości i wyeliminuj zdominowane opcje, a następnie przeprowadź inteligentną symulację kompromisów.
          </p>
        </div>
        
        {/* IDENTYCZNY KONTENER PRZYCISKÓW - Teraz w osobnym pliku */}
        <TradeoffToolbar 
          showTemplates={showTemplates} 
          setShowTemplates={setShowTemplates} 
        />

      </div>

      {/* 2. ROZWIJANE SZABLONY (Styl z Drzewa) */}
      {showTemplates && (
        <div className="border border-border rounded-lg p-4 bg-muted/20 animate-in fade-in slide-in-from-top-2 relative z-10">
          <h3 className="font-medium mb-3 text-sm text-foreground">Przykladowe decyzje</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(tradeoffScenarios).map(([key, scenarioData]) => (
              <button
  key={key}
  onClick={() => handleLoadTemplate(scenarioData)}
  className="p-4 border border-border rounded-lg bg-card hover:border-primary hover:bg-primary/5 transition-colors text-left shadow-sm group flex flex-col h-full"
>
                <div className="font-medium mb-1 text-foreground group-hover:text-primary transition-colors">{scenarioData.name}</div>
                <div className="text-xs text-muted-foreground">{scenarioData.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. KARTA Z TABELĄ */}
      <div className="w-full mx-auto bg-card rounded-xl border border-border shadow-sm p-6 overflow-hidden flex flex-col relative z-0">
        
        <div className="flex-1 overflow-auto custom-scrollbar">
            <TradeoffGrid />
        </div>
        
        <TradeoffSettings />
      
        <div className="mt-4 flex justify-end">
          <button 
            className="bg-transparent border-none text-destructive/80 text-xs font-semibold cursor-pointer hover:text-destructive hover:underline transition-colors"
            onClick={handleReset}
          >
            Resetuj wszystko
          </button>
        </div>
      </div>

    </div>
  );
}