import React, { useState, useEffect } from 'react';
import { useTableStore } from '../store/useTableStore';
import { Save, FileText, Scale, Trophy, History, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button'; 
import { Tooltip } from '../../../components/ui/Tooltip'; 
import { HistorySidebar } from '../../../components/ui/HistorySidebar';
import { Toast } from '../../../components/ui/Toast'; 
import { decisionApi } from '../../../api/decisionApi.js';

export function TablePageToolbar({ showTemplates, setShowTemplates }) {
  const currentProjectId = useTableStore(s => s.currentProjectId);
  const showTradeoffs = useTableStore(s => s.showTradeoffs);
  const showRanking = useTableStore(s => s.showRanking);
  const toggleTradeoffs = useTableStore(s => s.toggleTradeoffs);
  const toggleRanking = useTableStore(s => s.toggleRanking);
  const loadScenario = useTableStore(s => s.loadScenario); 
  const setCurrentProject = useTableStore(s => s.setCurrentProject);

  // Stany UI (Historia i Modale)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [toast, setToast] = useState(null); 
  
  // Stany danych
  const [historyItems, setHistoryItems] = useState([]);
  const [newProjectData, setNewProjectData] = useState({ title: '', notes: '' });
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- POBIERANIE LISTY HISTORII ---
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
        console.error("Błąd pobierania snapshotów:", error);
      }
    };
    fetchHistory();
  }, [currentProjectId]);

  // --- LOGIKA "SMART SAVE" DO CHMURY ---
  const handleSaveClick = () => {
    if (!currentProjectId) setIsCreateModalOpen(true);
    else setIsSnapshotModalOpen(true);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectData.title.trim()) return;
    
    setIsSaving(true);
    try {
      const res = await decisionApi.createProject(newProjectData.title, 'TABLE');
      if (newProjectData.notes.trim()) {
        await decisionApi.patchNotes(res.id, newProjectData.notes);
      }
      
      setCurrentProject(res.id);
      await useTableStore.getState().saveToBackend(); 
      
      setToast({ message: "Projekt utworzony!", type: "success" });
      setIsCreateModalOpen(false);
      setNewProjectData({ title: '', notes: '' });
    } catch (error) {
      console.error("Błąd tworzenia projektu:", error);
      setToast({ message: "Błąd tworzenia projektu.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSnapshot = async (e) => {
    e.preventDefault();
    if (!snapshotLabel.trim() || !currentProjectId) return;

    setIsSaving(true);
    try {
      await useTableStore.getState().saveToBackend();
      const newSnapshot = await decisionApi.createSnapshot(currentProjectId, snapshotLabel);
      
      setHistoryItems(prev => [{
        id: newSnapshot.id, 
        title: newSnapshot.label,
        date: newSnapshot.createdAt,
        tags: ['RĘCZNY']
      }, ...prev]);

      setToast({ message: `Wersja zapisana.`, type: "success" });
      setIsSnapshotModalOpen(false);
      setSnapshotLabel('');
    } catch (error) {
      console.error("Błąd snapshotu:", error);
      setToast({ message: "Błąd zapisu wersji.", type: "error" }); 
    } finally {
      setIsSaving(false);
    }
  };

  // --- WEHIKUŁ CZASU ---
  const handleSelectHistoryItem = async (id) => {
    setIsSaving(true);
    try {
      const snapshot = await decisionApi.getSnapshot(currentProjectId, id);
      
      let rawContent = snapshot.content;
      if (typeof rawContent === 'string') {
         try { rawContent = JSON.parse(rawContent); } catch(e){}
      }
      const safeContent = rawContent || {};

      loadScenario(safeContent);
      setIsPreviewMode(true);
      setToast({ message: `Podgląd: ${snapshot.label || id}`, type: "info" });
    } catch (error) {
      console.error("Błąd wczytywania snapshotu:", error);
      setToast({ message: "Nie wczytano wersji.", type: "error" });
    } finally {
      setIsSaving(false);
      setIsHistoryOpen(false);
    }
  };

  return (
    <>
      {/* BANER PODGLĄDU HISTORII */}
      {isPreviewMode && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500/95 dark:bg-amber-600/95 backdrop-blur-md border-b border-amber-600/50 dark:border-amber-700/50 text-white py-2.5 px-4 z-[200] flex justify-center items-center gap-4 shadow-lg animate-in slide-in-from-top">
          <span className="font-medium flex items-center gap-2 drop-shadow-sm">
            <History className="w-4 h-4" /> Tryb podglądu historycznej wersji
          </span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="bg-background text-foreground hover:bg-muted shadow-sm border border-border transition-colors"
              onClick={async () => {
                await useTableStore.getState().saveToBackend();
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
                  loadScenario(rawContent || {});
                  setIsPreviewMode(false);
                } catch(e) {
                   setToast({ message: "Błąd powrotu do aktualnej.", type: "error" });
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

        {/* --- PRZYCISKI CHMURY --- */}
        <Button variant="secondary" onClick={() => setIsHistoryOpen(true)}>
          <History className="w-4 h-4 mr-2" /> Historia
        </Button>

        <Button variant={currentProjectId ? "secondary" : "default"} onClick={handleSaveClick}>
          <Save className="w-4 h-4 mr-2" /> {currentProjectId ? "Zapisz wersję" : "Zapisz projekt"}
        </Button>

        {/* --- PRZYCISKI ANALITYCZNE --- */}
        <div className="relative flex">
          <Button variant={showTradeoffs ? "purple" : "defaultPurple"} onClick={toggleTradeoffs}>
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

        <Button variant={showRanking ? "amber" : "defaultAmber"} onClick={toggleRanking}>
          <Trophy className="w-4 h-4 mr-2" /> Ranking
        </Button>

        <HistorySidebar 
          isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)}
          items={historyItems} type="table" onSelectItem={handleSelectHistoryItem} 
        />

        {/* MODAL TWORZENIA PROJEKTU */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-md p-6 rounded-xl shadow-xl border border-border animate-in fade-in zoom-in-95 relative">
              <button onClick={() => setIsCreateModalOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold mb-1">Zapisz jako nowy projekt</h2>
              <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nazwa projektu <span className="text-destructive">*</span></label>
                  <input autoFocus required value={newProjectData.title} onChange={e => setNewProjectData({...newProjectData, title: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notatka (opcjonalnie)</label>
                  <textarea value={newProjectData.notes} onChange={e => setNewProjectData({...newProjectData, notes: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary resize-none" rows={3}/>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Anuluj</Button>
                  <Button type="submit" disabled={isSaving}>Utwórz projekt</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL SNAPSHOTU */}
        {isSnapshotModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card w-full max-w-md p-6 rounded-xl shadow-xl border border-border animate-in fade-in zoom-in-95 relative">
              <button onClick={() => setIsSnapshotModalOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold mb-1">Zapisz wersję</h2>
              <form onSubmit={handleCreateSnapshot} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nazwa wersji <span className="text-destructive">*</span></label>
                  <input autoFocus required value={snapshotLabel} onChange={e => setSnapshotLabel(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsSnapshotModalOpen(false)}>Anuluj</Button>
                  <Button type="submit" disabled={isSaving}>Zamroź wersję</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </>
  );
}