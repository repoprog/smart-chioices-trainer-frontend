import React, { useState, useEffect } from 'react';
import { useTreeStore } from './store/useTreeStore.js';
import { treeScenarios } from './data/treeScenarios.js'; 
import { TreeCanvas } from './components/TreeCanvas.jsx';
import { TreePageToolbar } from './components/TreePageToolbar.jsx';
import { ConfirmModal } from '../../components/ui/ConfirmModal'; 
import { Tooltip } from '../../components/ui/Tooltip'; // <-- NASZ NOWY KOMPONENT
import { Lock } from 'lucide-react'; 

export function DecisionTreePage() {
  const { loadScenario, resetTree, isDirty } = useTreeStore();
  const [showTemplates, setShowTemplates] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);

  // CORE MECHANIC: Prevent data loss by intercepting page unload if changes are unsaved
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // CORE MECHANIC: Handle scenario loading from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scenarioKey = params.get('scenario'); 
    if (scenarioKey && treeScenarios[scenarioKey]) {
      const data = treeScenarios[scenarioKey];
      loadScenario(data.nodes, data.edges, data.labels);
    }
  }, [loadScenario]);

  const handleTemplateClick = (scenarioData) => {
    if (isDirty) {
      setPendingTemplate(scenarioData); 
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
      <div className="flex flex-wrap md:flex-nowrap items-start md:items-center justify-between gap-4 relative z-50">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Drzewo decyzyjne</h2>
          
          <div className="text-muted-foreground mt-1 text-sm flex flex-wrap items-center gap-1 leading-relaxed">
            <span>Najedź na węzeł, aby dodać gałąź. Zmieniaj prawdopodobieństwa i obserwuj wyniki w czasie rzeczywistym (What-if</span>
            
            {/* TOOLTIP REFACTOR: Replacing manual logic with Tooltip component */}
            <Tooltip
              title="Symulacja „What-if”"
              subtitle="(Auto-balans)"
              trigger={
                <button 
                  className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-full border border-border bg-muted text-muted-foreground text-[10px] font-bold transition-all hover:bg-background hover:text-primary hover:border-primary focus:outline-none -translate-y-[1px]"
                >
                  ?
                </button>
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

            <span>).</span>
          </div>
        </div>
        
        <TreePageToolbar 
          showTemplates={showTemplates} 
          setShowTemplates={setShowTemplates} 
        />
      </div>

      {/* Template selection and Canvas container remain unchanged but now cleaner in context */}
      {showTemplates && (
        <div className="border border-border rounded-lg p-4 bg-muted/20 animate-in fade-in slide-in-from-top-2 relative z-10">
          <h3 className="font-medium mb-3 text-sm text-foreground">Predefiniowane szablony</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(treeScenarios).map(([key, scenarioData]) => (
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

      <div className="flex-1 min-h-[600px] border border-border rounded-xl overflow-hidden bg-card shadow-sm relative z-0 flex flex-col">
        <TreeCanvas />
      </div>

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => { resetTree(); setIsResetModalOpen(false); }}
        title="Czyszczenie obszaru"
        message="Czy na pewno chcesz usunąć całe drzewo decyzyjne? Tej akcji nie można cofnąć."
        variant="danger"
        confirmText="Wyczyść drzewo"
      />

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