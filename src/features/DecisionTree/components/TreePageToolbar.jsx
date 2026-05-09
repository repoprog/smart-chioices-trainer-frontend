import React, { useState, useEffect } from 'react';
import { useTreeStore } from '../store/useTreeStore.js';
import { Save, FileText, History, SlidersHorizontal, Lock, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button'; 
import { Tooltip } from '../../../components/ui/Tooltip'; 
import { HistorySidebar } from '../../../components/ui/HistorySidebar';
import { Toast } from '../../../components/ui/Toast'; 
import { decisionApi } from '../../../api/decisionApi.js';

export function TreePageToolbar({ showTemplates, setShowTemplates }) {
  const { currentProjectId, isSimulationMode, toggleSimulationMode } = useTreeStore();
  
  // UI States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [toast, setToast] = useState(null); 
  
  // Data States
  const [historyItems, setHistoryItems] = useState([]);
  const [newProjectData, setNewProjectData] = useState({ title: '', notes: '' });
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- FETCH HISTORY FROM BACKEND ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentProjectId) {
        setHistoryItems([]);
        return;
      }
      try {
        const data = await decisionApi.getSnapshots(currentProjectId);
        const mappedHistory = data.map(s => ({
          id: s.id,
          title: s.label,
          date: s.createdAt,
          tags: s.trigger === 'MANUAL' ? ['RĘCZNY'] : ['AUTO']
        }));
        setHistoryItems(mappedHistory);
      } catch (error) {
        console.error("Błąd podczas pobierania snapshotów:", error);
      }
    };
    fetchHistory();
  }, [currentProjectId]);

  // --- SMART SAVE LOGIC ---
  const handleSaveClick = () => {
    if (!currentProjectId) {
      setIsCreateModalOpen(true);
    } else {
      setIsSnapshotModalOpen(true);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectData.title.trim()) return;
    
    setIsSaving(true);
    try {
      const res = await decisionApi.createProject(newProjectData.title, 'TREE');
      if (newProjectData.notes.trim()) {
        await decisionApi.patchNotes(res.id, newProjectData.notes);
      }
      
      useTreeStore.getState().setCurrentProject(res.id);
      await useTreeStore.getState().saveToBackend(); 
      
      setToast({ message: "Projekt został utworzony!", type: "success" });
      setIsCreateModalOpen(false);
      setNewProjectData({ title: '', notes: '' });
    } catch (error) {
      console.error("Błąd tworzenia projektu:", error);
      setToast({ message: "Błąd podczas tworzenia projektu.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSnapshot = async (e) => {
    e.preventDefault();
    if (!snapshotLabel.trim() || !currentProjectId) return;

    setIsSaving(true);
    try {
      await useTreeStore.getState().saveToBackend();
      const newSnapshot = await decisionApi.createSnapshot(currentProjectId, snapshotLabel);
      
      setHistoryItems(prev => [{
        id: newSnapshot.id, 
        title: newSnapshot.label,
        date: newSnapshot.createdAt,
        tags: ['RĘCZNY']
      }, ...prev]);

      setToast({ message: `Wersja "${snapshotLabel}" zapisana.`, type: "success" });
      setIsSnapshotModalOpen(false);
      setSnapshotLabel('');
    } catch (error) {
      console.error("Błąd snapshotu:", error);
      setToast({ message: "Nie udało się zapisać wersji.", type: "error" }); 
    } finally {
      setIsSaving(false);
    }
  };

  // --- TIME MACHINE LOGIC ---
  const handleSelectHistoryItem = async (id) => {
    setIsSaving(true);
    try {
      const snapshot = await decisionApi.getSnapshot(currentProjectId, id);
      let rawContent = snapshot.content;
      if (typeof rawContent === 'string') {
         try { rawContent = JSON.parse(rawContent); } catch(e){}
      }
      const safeContent = rawContent || {};

      useTreeStore.getState().loadScenario(
        safeContent.nodes || [], 
        safeContent.edges || [], 
        safeContent.stageColumnLabels || safeContent.labels || []
      );

      setIsPreviewMode(true);
      setToast({ message: `Podgląd wersji: ${snapshot.label || id}`, type: "info" });
    } catch (error) {
      console.error("Błąd wczytywania snapshotu:", error);
      setToast({ message: "Nie udało się wczytać wersji z serwera.", type: "error" });
    } finally {
      setIsSaving(false);
      setIsHistoryOpen(false); 
    }
  };

  return (
    <>
      {/* --- TIME MACHINE BANNER --- */}
      {isPreviewMode && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500/95 dark:bg-amber-600/95 backdrop-blur-md border-b border-amber-600/50 dark:border-amber-700/50 text-white py-2.5 px-4 z-[200] flex justify-center items-center gap-4 shadow-lg animate-in slide-in-from-top">
          <span className="font-medium flex items-center gap-2 drop-shadow-sm">
            <History className="w-4 h-4" /> Tryb podglądu historycznej wersji
          </span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="bg-background text-foreground hover:bg-muted shadow-sm border border-border transition-colors font-semibold"
              onClick={async () => {
                await useTreeStore.getState().saveToBackend();
                setIsPreviewMode(false);
                setToast({ message: "Wersja została przywrócona.", type: "success" });
              }}
            >
              Przywróć tę wersję
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/20 hover:text-white transition-colors"
              onClick={async () => {
                try {
                  const original = await decisionApi.getProject(currentProjectId);
                  let rawContent = original.content;
                  if (typeof rawContent === 'string') {
                    try { rawContent = JSON.parse(rawContent); } catch(e){}
                  }
                  const safeContent = rawContent || {};

                  useTreeStore.getState().loadScenario(
                    safeContent.nodes || [], 
                    safeContent.edges || [], 
                    safeContent.stageColumnLabels || safeContent.labels || []
                  );
                  setIsPreviewMode(false);
                } catch(e) {
                   setToast({ message: "Błąd podczas wracania do aktualnej wersji.", type: "error" });
                }
              }}
            >
              Wróć do aktualnej
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-3 shrink-0 flex-wrap justify-end relative z-20">
        
        <Button variant="secondary" onClick={() => setShowTemplates(!showTemplates)}>
          <FileText className="w-4 h-4 mr-2" /> Przykłady
        </Button>

        <Button variant="secondary" onClick={() => setIsHistoryOpen(true)}>
          <History className="w-4 h-4 mr-2" /> Historia
        </Button>

        <Button 
          variant={currentProjectId ? "secondary" : "default"} 
          onClick={handleSaveClick}
        >
          <Save className="w-4 h-4 mr-2" /> {currentProjectId ? "Zapisz wersję" : "Zapisz projekt"}
        </Button>
        
        <div className="relative flex">
          <Button 
            variant={isSimulationMode ? "cyan" : "defaultCyan"}
            onClick={toggleSimulationMode}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" /> Symulacja
            
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
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)}
          items={historyItems}
          type="tree"
          onSelectItem={handleSelectHistoryItem}
        />

        {/* MODALS */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-md p-6 rounded-xl shadow-xl border border-border animate-in fade-in zoom-in-95 relative">
              <button onClick={() => setIsCreateModalOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-1">Zapisz jako nowy projekt</h2>
              <p className="text-sm text-muted-foreground mb-5">Obecne drzewo zostanie zapisane na Twoim koncie.</p>
              
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nazwa projektu <span className="text-destructive">*</span></label>
                  <input 
                    autoFocus required
                    value={newProjectData.title}
                    onChange={e => setNewProjectData({...newProjectData, title: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary"
                    placeholder="Np. Wybór nowej floty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notatka (opcjonalnie)</label>
                  <textarea 
                    value={newProjectData.notes}
                    onChange={e => setNewProjectData({...newProjectData, notes: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Anuluj</Button>
                  <Button type="submit" disabled={isSaving}>Utwórz projekt</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isSnapshotModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-md p-6 rounded-xl shadow-xl border border-border animate-in fade-in zoom-in-95 relative">
              <button onClick={() => setIsSnapshotModalOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-1">Zapisz wersję</h2>
              <p className="text-sm text-muted-foreground mb-5">Zamroź obecny stan drzewa.</p>
              
              <form onSubmit={handleCreateSnapshot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nazwa wersji <span className="text-destructive">*</span></label>
                  <input 
                    autoFocus required
                    value={snapshotLabel}
                    onChange={e => setSnapshotLabel(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsSnapshotModalOpen(false)}>Anuluj</Button>
                  <Button type="submit" disabled={isSaving}>Zamroź wersję</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </div>
    </>
  );
}