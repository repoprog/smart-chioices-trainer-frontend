import React from 'react';
import { useTableStore } from '../store/useTableStore';
import { Save, FileText, Scale, Trophy, History, Camera } from 'lucide-react';
import { Button } from '../../../components/ui/Button'; 
import { Tooltip } from '../../../components/ui/Tooltip'; 
import { HistorySidebar } from '../../../components/ui/HistorySidebar';
import { useToastStore } from '../../../store/useToastStore'; 
import { HistoryPreviewBanner } from '../../../components/ui/HistoryPreviewBanner'; 
import { usePendingProjectSave } from '../../../hooks/usePendingProjectSave';
import { useCloudProjectActions } from '../../../hooks/useCloudProjectActions';
import { PROJECT_TYPES } from '../../../constants/decisionTypes'; 

import { SaveDecisionModal } from '../../../components/ui/SaveDecisionModal';
import { SaveVersionModal } from '../../../components/ui/SaveVersionModal';

export function TablePageToolbar({ showTemplates, setShowTemplates }) {
  const currentProjectId = useTableStore(s => s.currentProjectId);
  const showTradeoffs = useTableStore(s => s.showTradeoffs);
  const showRanking = useTableStore(s => s.showRanking);
  const isPreviewMode = useTableStore(s => s.isPreviewMode);
  const previewingSnapshotId = useTableStore(s => s.previewingSnapshotId);
  
  const toggleTradeoffs = useTableStore(s => s.toggleTradeoffs);
  const toggleRanking = useTableStore(s => s.toggleRanking);
  const setCurrentProject = useTableStore(s => s.setCurrentProject);

  const addToast = useToastStore(s => s.addToast);

  const actions = useCloudProjectActions({
    projectType: PROJECT_TYPES.TABLE, 
    currentProjectId,
    setCurrentProject,
    saveToBackend: useTableStore.getState().saveToBackend,
    enterPreviewMode: useTableStore.getState().enterPreviewMode,
    exitPreviewMode: useTableStore.getState().exitPreviewMode,
    setGlobalDirty: (val) => useTableStore.setState({ isDirty: val }),
    loadScenarioFn: (safeContent) => useTableStore.getState().loadScenario(safeContent)
  });

  usePendingProjectSave({
    expectedType: PROJECT_TYPES.TABLE,
    setCurrentProject, 
    saveToBackend: useTableStore.getState().saveToBackend,
    setIsSaving: actions.setIsSaving,
    // Bezpośrednie przekazanie globalnego Toasta
    setToast: (t) => addToast(t.message, t.type) 
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

      <div className="flex gap-3 shrink-0 flex-wrap justify-end relative z-20">
        
        <Button 
          variant="secondary" 
          onClick={() => setShowTemplates(!showTemplates)}
          disabled={isPreviewMode} 
        >
          <FileText className="w-4 h-4 mr-2" /> Przykłady
        </Button>

        <Button 
          variant="secondary" 
          onClick={() => actions.setIsHistoryOpen(true)}
          disabled={isPreviewMode} 
        >
          <History className="w-4 h-4 mr-2" /> Historia
        </Button>

        <Button variant={currentProjectId ? "secondary" : "default"} onClick={actions.handleSaveClick} disabled={isPreviewMode}>
  {currentProjectId ? <Camera className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
  {currentProjectId ? "Zapisz wersję" : "Zapisz tabelę"}
</Button>

        <div className="relative flex">
          <Button 
            variant={showTradeoffs ? "purple" : "defaultPurple"} 
            onClick={toggleTradeoffs}
            disabled={isPreviewMode} 
          >
            <Scale className="w-4 h-4 mr-2" /> Kompromisy
            <Tooltip 
              title="Kompromisy" 
              position="bottom-right"
              width="w-[380px]"
              trigger={
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current text-[10px] font-bold -translate-y-[1px] ml-1.5 transition-all hover:bg-white hover:text-purple-500">
                  ?
                </span>
              }
            >
              <div className="mb-4">
                <p className="text-xs m-0">
                  Polegają na stopniowej eliminacji celów. Jeżeli w jednym z celów wartości są takie same dla każdej alternatywy, ten cel można pominąć - nie wpływa już na decyzję.
                </p>
              </div>
              
              <div className="mb-5">
                <h4 className="mb-1.5 text-foreground text-[14px] font-semibold">Równa wymiana</h4>
                <p className="text-xs m-0 mb-2">
                  Wybierz łatwy cel, np. czas dojazdu. Znajdź w tabeli alternatywę z najlepszym czasem i zastanów się, o ile musiałbyś zwiększyć inny cel (np. czynsz) w pozostałych alternatywach, aby wyrównać w nich czas do tego poziomu. Np. każde 10 min mniej dojazdu zwiększa czynsz o 300zł.
                </p>
                <p className="text-xs m-0 mb-3">
                  Wprowadź zmiany, cel zostanie przekreślony — skoro jest równy, nie ma już znaczenia.
                </p>
                <p className="text-foreground text-[13px] font-semibold m-0 mb-1.5">
                  Postępuj tak dla kolejnych, łatwych celów, aż:
                </p>
                <ul className="m-0 pl-5 mb-0 list-disc text-xs marker:text-primary">
                  <li className="mb-1">wyłonisz zwycięzcę, albo</li>
                  <li className="mb-1">zostanie tylko jeden cel do porównania.</li>
                </ul>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg border border-border/50 flex gap-2.5 items-start mt-2">
                <span className="text-base leading-none">💡</span>
                <p className="m-0 text-xs italic">
                  Najprościej wyrównywać atrybuty (np. czas, standard, kolor), a zmieniać kwoty.
                </p>
              </div>
            </Tooltip>
          </Button>
        </div>

        <Button 
          variant={showRanking ? "amber" : "defaultAmber"} 
          onClick={toggleRanking}
          disabled={isPreviewMode} 
        >
          <Trophy className="w-4 h-4 mr-2" /> Ranking
        </Button>

        <HistorySidebar 
          isOpen={actions.isHistoryOpen} onClose={() => actions.setIsHistoryOpen(false)}
          items={actions.historyItems} type="table" onSelectItem={actions.handleSelectHistoryItem} 
        />

        {/* --- UŻYCIE REUŻYWALNYCH MODALI ZAMIAST CZYSTEGO HTML --- */}
        <SaveDecisionModal
          isOpen={actions.isCreateModalOpen}
          onClose={() => actions.setIsCreateModalOpen(false)}
          title="Zapisz tabelę decyzyjną"
          placeholder="np. Wybór dostawcy IT dla projektu X"
          newProjectData={actions.newProjectData}
          setNewProjectData={actions.setNewProjectData}
          handleCreateProject={actions.handleCreateProject}
          isSaving={actions.isSaving}
        />

        <SaveVersionModal
          isOpen={actions.isSnapshotModalOpen}
          onClose={() => actions.setIsSnapshotModalOpen(false)}
          snapshotLabel={actions.snapshotLabel}
          setSnapshotLabel={actions.setSnapshotLabel}
          handleCreateSnapshot={actions.handleCreateSnapshot}
          isSaving={actions.isSaving}
        />

      </div>
    </>
  );
}