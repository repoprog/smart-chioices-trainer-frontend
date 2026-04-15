import React, { useState, useEffect } from "react";
import { useTableStore } from "./store/useTableStore"; 
import { tableScenarios } from "./data/tableScenarios"; 

import { TableGrid } from "./components/TableGrid";
import { TableSettings } from "./components/TableSettings";
import { TablePageToolbar } from "./components/TablePageToolbar";

import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Card } from "../../components/ui/Card";       // <-- IMPORT NOWEGO KOMPONENTU
import { Button } from "../../components/ui/Button";   // <-- IMPORT SYSTEMOWEGO PRZYCISKU

export function DecisionTablePage() {
  const resetAll = useTableStore((s) => s.resetAll);
  const loadScenario = useTableStore((s) => s.loadScenario);
  const isDirty = useTableStore((s) => s.isDirty);

  const [showTemplates, setShowTemplates] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);

  // CORE MECHANIC: Prevent data loss by intercepting page unload if changes are unsaved
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // CORE MECHANIC: Handle scenario loading from URL parameters on initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scenarioKey = params.get("scenario");
    if (scenarioKey && tableScenarios[scenarioKey]) {
      loadScenario(tableScenarios[scenarioKey]);
    }
  }, [loadScenario]);

  const handleResetClick = () => {
    if (isDirty) {
      setIsResetModalOpen(true);
    } else {
      resetAll();
    }
  };

  const handleTemplateClick = (scenarioData) => {
    if (isDirty) {
      setPendingTemplate(scenarioData);
    } else {
      loadScenario(scenarioData);
      setShowTemplates(false);
    }
  };

  const confirmLoadTemplate = () => {
    if (pendingTemplate) {
      loadScenario(pendingTemplate);
      setPendingTemplate(null);
      setShowTemplates(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap md:flex-nowrap items-start md:items-center justify-between gap-4 relative z-50">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Tabela Smart Choices
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed max-w-3xl">
            Wypisz cele (kryteria) i alternatywy, oceń każdą opcję i wyeliminuj zdominowane w rankingu, dokonuj kompromisów między celami, aż wyłoni się najlepsza decyzja.
          </p>
        </div>
        <TablePageToolbar showTemplates={showTemplates} setShowTemplates={setShowTemplates} />
      </div>

      {/* TEMPLATES SECTION  */}
      {showTemplates && (
        <Card 
          noPadding 
          className="p-4 bg-muted/20 animate-in fade-in slide-in-from-top-2 relative z-10"
        >
          <h3 className="font-medium mb-3 text-sm text-foreground">Przykładowe decyzje</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(tableScenarios).map(([key, scenarioData]) => (
              <button
                key={key}
                onClick={() => handleTemplateClick(scenarioData)}
                className="p-4 border border-border rounded-lg bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors text-left shadow-sm group flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div className="font-medium mb-1 text-foreground group-hover:text-primary transition-colors">
                  {scenarioData.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {scenarioData.description}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* MAIN TABLE AREA */}
      <Card className="flex-1 overflow-auto max-h-[85vh] custom-scrollbar flex flex-col relative z-0 p-6">
        <TableGrid />
        <TableSettings />
        
        <div className="mt-6 flex justify-end">
          <Button
            variant="dangerGhost"
            size="sm"
            onClick={handleResetClick}
          >
            Resetuj wszystko
          </Button>
        </div>
      </Card>

      {/* MODALS */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => { resetAll(); setIsResetModalOpen(false); }}
        title="Resetowanie tabeli"
        message="Czy na pewno chcesz zresetować całą tabelę i zacząć od nowa? Niezapisane dane zostaną utracone."
        variant="danger"
        confirmText="Resetuj tabelę"
      />

      <ConfirmModal
        isOpen={pendingTemplate !== null}
        onClose={() => setPendingTemplate(null)}
        onConfirm={confirmLoadTemplate}
        title="Nadpisanie tabeli"
        message="Załadowanie nowego szablonu usunie Twoje dotychczasowe wpisy. Czy na pewno chcesz kontynuować?"
        variant="warning"
        confirmText="Załaduj szablon"
      />
    </div>
  );
}