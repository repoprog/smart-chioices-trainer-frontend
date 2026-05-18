import React from 'react'; 
import { useTreeStore } from '../store/useTreeStore.js';
import { Save, FileText, History, SlidersHorizontal, Lock, Camera, Loader2, Calculator, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button'; 
import { Tooltip } from '../../../components/ui/Tooltip'; 
import { HistorySidebar } from '../../../components/ui/HistorySidebar';

import { HistoryPreviewBanner } from '../../../components/ui/HistoryPreviewBanner'; 
import { usePendingProjectSave } from '../../../hooks/usePendingProjectSave';
import { useCloudProjectActions } from '../../../hooks/useCloudProjectActions';
import { PROJECT_TYPES } from '../../../constants/decisionTypes'; 

import { SaveDecisionModal } from '../../../components/ui/SaveDecisionModal';
import { SaveVersionModal } from '../../../components/ui/SaveVersionModal';

export function TreePageToolbar({ showTemplates, setShowTemplates }) {
  const { 
    currentProjectId, isSimulationMode, toggleSimulationMode, 
    isPreviewMode, previewingSnapshotId, setCurrentProject, 
    saveToBackend, enterPreviewMode, exitPreviewMode,
    isCalculating, backendWarnings, analyzeWithBackend
  } = useTreeStore();
 
  const actions = useCloudProjectActions({
    projectType: PROJECT_TYPES.TREE, 
    currentProjectId,
    setCurrentProject,
    saveToBackend,
    enterPreviewMode,
    exitPreviewMode,
    setGlobalDirty: (val) => useTreeStore.setState({ isDirty: val }),
    loadScenarioFn: (safeContent) => useTreeStore.getState().loadScenario(
      safeContent.nodes || [], 
      safeContent.edges || [], 
      safeContent.stageColumnLabels || safeContent.labels || []
    ),
    getCurrentStateFn: () => {
      const state = useTreeStore.getState();
      return {
        nodes: state.nodes,
        edges: state.edges,
        stageColumnLabels: state.stageColumnLabels
      };
    }
  });

  usePendingProjectSave({
    expectedType: PROJECT_TYPES.TREE,
    setCurrentProject,
    saveToBackend,
    setIsSaving: actions.setIsSaving,
  });

  const previewedItem = actions.historyItems.find(item => item.id === previewingSnapshotId);

  return (
    <>
      <HistoryPreviewBanner
        isVisible={isPreviewMode}
        itemTitle={previewedItem?.title || "Nieznana wersja"}
        itemDate={previewedItem?.date}
        onRestore={actions.handleRestoreVersion}
        onClose={actions.handleClosePreview}
      />

      {/* ZMIENIONY KONTENER: Układ chmury tagów wyrównany do prawej */}
      <div className="flex flex-wrap gap-1.5 lg:gap-3 justify-end items-center relative z-20 w-full lg:w-auto mt-2 lg:mt-0">
        
        <Button 
          variant="secondary" 
          onClick={() => setShowTemplates(!showTemplates)}
          disabled={isPreviewMode}
          className="h-8 px-2.5 text-xs lg:h-9 lg:px-4 lg:text-sm"
        >
          <FileText className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" /> Przykłady
        </Button>

        <Button 
          variant="secondary" 
          onClick={() => actions.setIsHistoryOpen(true)}
          disabled={isPreviewMode}
          className="h-8 px-2.5 text-xs lg:h-9 lg:px-4 lg:text-sm"
        >
          <History className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" /> Historia
        </Button>

        <Button 
          variant={currentProjectId ? "secondary" : "default"} 
          onClick={actions.handleSaveClick} 
          disabled={isPreviewMode}
          className="h-8 px-2.5 text-xs lg:h-9 lg:px-4 lg:text-sm"
        >
          {currentProjectId ? <Camera className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" /> : <Save className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" />} 
          {currentProjectId ? "Zapisz wersję" : "Zapisz drzewo"}
        </Button>
        
        <Button 
          variant="secondary" 
          onClick={analyzeWithBackend}
          disabled={isCalculating || isPreviewMode}
          className="h-8 px-2.5 text-xs lg:h-9 lg:px-4 lg:text-sm"
        >
          {isCalculating ? (
            <><Loader2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2 animate-spin" /> Liczę...</>
          ) : (
            <><Calculator className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" /> Przelicz</>
          )}
        </Button>

        <div className="relative flex">
          <Button 
            variant={isSimulationMode ? "cyan" : "defaultCyan"}
            onClick={toggleSimulationMode}
            disabled={isPreviewMode}
            className="h-8 px-2.5 text-xs lg:h-9 lg:px-4 lg:text-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" /> Symulacja
            
            {/* Tooltip w oryginalnej formie, skoro Portal załatwił sprawę */}
            <Tooltip 
              title="Symulacja „What-if”" 
              subtitle="(Auto-balans)"
              position="bottom-right"
              width="w-[380px]"
              trigger={
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current text-[10px] font-bold -translate-y-[1px] ml-1.5 transition-all hover:bg-white hover:text-cyan-600">
                  ?
                </span>
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
          </Button>
        </div>

        <HistorySidebar 
          isOpen={actions.isHistoryOpen} 
          onClose={() => actions.setIsHistoryOpen(false)}
          items={actions.historyItems}
          type="tree"
          onSelectItem={actions.handleSelectHistoryItem}
        />

        <SaveDecisionModal
          isOpen={actions.isCreateModalOpen}
          onClose={() => actions.setIsCreateModalOpen(false)}
          title="Zapisz drzewo decyzyjne"
          placeholder="Np. Wybór nowej floty"
          onSubmit={actions.handleCreateProject}
          isSaving={actions.isSaving}
        />

        <SaveVersionModal
          isOpen={actions.isSnapshotModalOpen}
          onClose={() => actions.setIsSnapshotModalOpen(false)}
          onSubmit={actions.handleCreateSnapshot}
          isSaving={actions.isSaving}
        />

        {backendWarnings && backendWarnings.length > 0 && (
          <div className="w-full flex flex-col gap-2 mt-2">
            {backendWarnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-2 px-3 py-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md shadow-sm text-left">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
