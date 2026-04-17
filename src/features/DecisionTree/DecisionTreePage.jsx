import React, { useState, useEffect } from 'react';
import { useTreeStore } from './store/useTreeStore.js';
import { decisionApi } from '../../api/decisionApi'; 

import { TreeCanvas } from './components/TreeCanvas.jsx';
import { TreePageToolbar } from './components/TreePageToolbar.jsx';
import { ConfirmModal } from '../../components/ui/ConfirmModal'; 
import { Tooltip } from '../../components/ui/Tooltip'; 
import { Card } from '../../components/ui/Card'; 
import { Lock } from 'lucide-react'; 

export function DecisionTreePage() {

  const resetTree = useTreeStore((s) => s.resetTree);
  const isDirty = useTreeStore((s) => s.isDirty);
  const loadRemoteTreeScenario = useTreeStore((s) => s.loadRemoteTreeScenario);

  const [showTemplates, setShowTemplates] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const isLoading = useTreeStore((s) => s.isLoading);
  
 
  const [scenariosList, setScenariosList] = useState([]);
  const [pendingTemplateId, setPendingTemplateId] = useState(null);

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


  useEffect(() => {
    decisionApi.getTreeScenarios()
      .then((data) => setScenariosList(data))
      .catch((err) => console.error("Nie udało się pobrać listy scenariuszy drzewa:", err));
  }, []);

  // CORE MECHANIC: Handle scenario loading from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scenarioKey = params.get('scenario'); 
    if (scenarioKey) {
      loadRemoteTreeScenario(scenarioKey);
    }
  }, [loadRemoteTreeScenario]);

 
  const handleTemplateClick = (scenarioId) => {
    if (isDirty) {
      setPendingTemplateId(scenarioId); 
    } else {
      loadRemoteTreeScenario(scenarioId);
      setShowTemplates(false);
    }
  };

  const confirmLoadTemplate = () => {
    if (pendingTemplateId) {
      loadRemoteTreeScenario(pendingTemplateId);
      setPendingTemplateId(null);
      setShowTemplates(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-wrap md:flex-nowrap items-start md:items-center justify-between gap-4 relative z-50">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Drzewo decyzyjne</h2>
          
          <div className="text-muted-foreground mt-1 text-sm flex flex-wrap items-center gap-1 leading-relaxed">
            <span>Najedź na węzeł, aby dodać gałąź. Zmieniaj prawdopodobieństwa i obserwuj wyniki w czasie rzeczywistym </span>
            
          
          </div>
        </div>
        
        <TreePageToolbar 
          showTemplates={showTemplates} 
          setShowTemplates={setShowTemplates} 
        />
      </div>

   
      {showTemplates && (
        <Card noPadding className="p-4 bg-muted/20 animate-in fade-in slide-in-from-top-2 relative z-10">
          <h3 className="font-medium mb-3 text-sm text-foreground">Predefiniowane szablony</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
            {scenariosList.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleTemplateClick(scenario.id)}
                className="p-4 border border-border rounded-lg bg-card hover:border-primary hover:bg-primary/5 transition-colors text-left shadow-sm group flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div className="font-medium mb-1 text-foreground group-hover:text-primary transition-colors">
                  {scenario.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {scenario.description || "Brak opisu"}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

  
      <Card noPadding className="flex-1 min-h-[600px] overflow-hidden relative z-0 flex flex-col">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 animate-pulse tracking-wide">
              Pobieranie symulacji...
            </p>
          </div>
        )}
        <TreeCanvas />
      </Card>

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

        isOpen={pendingTemplateId !== null}
        onClose={() => setPendingTemplateId(null)}
        onConfirm={confirmLoadTemplate}
        title="Nadpisanie drzewa"
        message="Załadowanie nowego szablonu usunie Twoje obecne drzewo. Czy na pewno chcesz kontynuować?"
        variant="warning"
        confirmText="Załaduj szablon"
      />
    </div>
  );
}