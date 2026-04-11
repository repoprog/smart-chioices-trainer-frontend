import React, { useState, useEffect } from "react";

import { useTradeoffStore } from "../../store/useTradeOffStore";

import { TradeoffGrid } from "./TradeoffGrid";

import { TradeoffSettings } from "./TradeoffSettings";

import { tradeoffScenarios } from "../../data/tradeoffScenarios";

import { TradeoffToolbar } from "./TradeoffToolbar";

// ZMIEŃ ŚCIEŻKĘ PONIŻEJ NA TAKĄ, GDZIE ZAPISAŁEŚ PLIK MODALA:

import ConfirmModal from "../ConfirmModal";

export function TradeoffModule() {
  // 1. TWARDE WYCIĄGNIĘCIE FUNKCJI I FLAGI ZE STORE'A

  const resetAll = useTradeoffStore((s) => s.resetAll);

  const loadScenario = useTradeoffStore((s) => s.loadScenario);

  const isDirty = useTradeoffStore((s) => s.isDirty); // <--- TO JEST KLUCZOWE!

  // 2. STANY UI

  const [showTemplates, setShowTemplates] = useState(false);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [pendingTemplate, setPendingTemplate] = useState(null); // Trzyma szablon do potwierdzenia

  // 3. ZABEZPIECZENIE PRZED ZAMKNIĘCIEM PRZEGLĄDARKI / F5

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();

        e.returnValue = ""; // Wymusza natywny alert przeglądarki!
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // 4. ŁADOWANIE Z PARAMETRU URL

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const scenarioKey = params.get("scenario");

    if (scenarioKey && tradeoffScenarios[scenarioKey]) {
      loadScenario(tradeoffScenarios[scenarioKey]);
    }
  }, []);

  // --- LOGIKA RESETU ---

  const handleResetClick = () => {
    if (isDirty) {
      setIsResetModalOpen(true); // Pytamy, bo są zmiany
    } else {
      resetAll(); // Puste, więc czyścimy od razu
    }
  };

  // --- LOGIKA SZABLONÓW ---

  const handleTemplateClick = (scenarioData) => {
    if (isDirty) {
      setPendingTemplate(scenarioData); // Otwiera modal z pytaniem o nadpisanie
    } else {
      loadScenario(scenarioData); // Puste, więc ładujemy od razu

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
      {/* NAGŁÓWEK */}

      <div className="flex flex-wrap md:flex-nowrap items-start md:items-center justify-between gap-4 relative z-50">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Tabela Smart Choices
          </h2>

          <p className="text-muted-foreground mt-1 text-sm">
            Wypisz cele (kryteria) i alternatywy. Uzupełnij wartości i
            wyeliminuj zdominowane opcje...
          </p>
        </div>

        <TradeoffToolbar
          showTemplates={showTemplates}
          setShowTemplates={setShowTemplates}
        />
      </div>

      {/* SZABLONY */}

      {showTemplates && (
        <div className="border border-border rounded-lg p-4 bg-muted/20 animate-in fade-in slide-in-from-top-2 relative z-10">
          <h3 className="font-medium mb-3 text-sm text-foreground">
            Przykładowe decyzje
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(tradeoffScenarios).map(([key, scenarioData]) => (
              <button
                key={key}
                onClick={() => handleTemplateClick(scenarioData)}
                className="p-4 border border-border rounded-lg bg-card hover:border-primary hover:bg-primary/5 transition-colors text-left shadow-sm group flex flex-col h-full"
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
        </div>
      )}

      {/* TABELA - TUTAJ JEST KLUCZOWA ZMIANA */}

      {/* 1. Usunąłem overflow-hidden i h-full */}

      {/* 2. Dodałem overflow-auto, max-h-[85vh] i custom-scrollbar tutaj */}

      <div className="w-full mx-auto bg-card rounded-xl border border-border shadow-sm p-6 overflow-auto max-h-[85vh] custom-scrollbar flex flex-col relative z-0">
        <TradeoffGrid />

        <TradeoffSettings />

        <div className="mt-4 flex justify-end">
          <button
            className="bg-transparent border-none text-destructive/80 text-xs font-semibold cursor-pointer hover:text-destructive hover:underline transition-colors"
            onClick={handleResetClick}
          >
            Resetuj wszystko
          </button>
        </div>
      </div>

      {/* MODALE POZOSTAJĄ BEZ ZMIAN */}

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => {
          resetAll();

          setIsResetModalOpen(false);
        }}
        title="Resetowanie tabeli"
        message="Czy na pewno chcesz zresetować całą tabelę?"
        variant="danger"
        confirmText="Resetuj tabelę"
      />

      <ConfirmModal
        isOpen={pendingTemplate !== null}
        onClose={() => setPendingTemplate(null)}
        onConfirm={confirmLoadTemplate}
        title="Nadpisanie tabeli"
        message="Załadowanie nowego szablonu usunie Twoje dotychczasowe wpisy."
        variant="warning"
        confirmText="Załaduj szablon"
      />
    </div>
  );
}
