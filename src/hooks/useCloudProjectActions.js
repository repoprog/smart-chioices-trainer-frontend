import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { decisionApi } from '../api/decisionApi';
import { useToastStore } from '../store/useToastStore'; 

import { APP_ROUTES, STORAGE_KEYS } from '../constants/appConstants';
import { SNAPSHOT_TRIGGERS } from '../constants/apiConstants';

export function useCloudProjectActions({
  projectType,
  currentProjectId,
  setCurrentProject,
  saveToBackend,
  loadScenarioFn,
  enterPreviewMode,
  exitPreviewMode,
  setGlobalDirty
}) {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast); 


  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);

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
        }));
        setHistoryItems(mappedHistory);
      } catch (error) {
        console.error("Błąd podczas pobierania snapshotów:", error);
      }
    };
    fetchHistory();
  }, [currentProjectId]);

  // --- SMART SAVE LOGIC ---
  const handleSaveClick = useCallback(() => {
    if (!currentProjectId) setIsCreateModalOpen(true);
    else setIsSnapshotModalOpen(true);
  }, [currentProjectId]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectData.title.trim()) return;
    
    setIsSaving(true);
    try {
      const res = await decisionApi.createProject(newProjectData.title, projectType);
      if (newProjectData.notes.trim()) {
        await decisionApi.patchNotes(res.id, newProjectData.notes);
      }
      
      setCurrentProject(res.id);
      await saveToBackend(); 
      
      addToast("Decuzja została utworzona!", "success"); 
      setIsCreateModalOpen(false);
      setNewProjectData({ title: '', notes: '' });
    } catch (error) {
      console.error("Błąd tworzenia decyzji:", error);
      const isUnauthorized = error.response?.status === 401;
      const isNetworkError = !error.response;
      
      if (isUnauthorized) {
        sessionStorage.setItem(STORAGE_KEYS.PENDING_SAVE, JSON.stringify({
          title: newProjectData.title,
          notes: newProjectData.notes,
          type: projectType 
        }));
        
        const currentPath = window.location.pathname;
        setTimeout(() => navigate(`${APP_ROUTES.LOGIN}?returnTo=${encodeURIComponent(currentPath)}`), 2000);
      }
      
      addToast(
        isUnauthorized 
          ? "Zaloguj się, aby zapisać decuzje w chmurze." 
          : isNetworkError
            ? "Brak połączenia z serwerem. Sprawdź internet lub spróbuj później."
            : "Wystąpił błąd podczas tworzenia decuzji.", 
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSnapshot = async (e) => {
    e.preventDefault();
    if (!snapshotLabel.trim() || !currentProjectId) return;

    setIsSaving(true);
    try {
      await saveToBackend();
      const newSnapshot = await decisionApi.createSnapshot(currentProjectId, snapshotLabel);
      
      setHistoryItems(prev => [{
        id: newSnapshot.id, 
        title: newSnapshot.label,
        date: newSnapshot.createdAt,
        tags: ['RĘCZNY']
      }, ...prev]);

      addToast(`Wersja "${snapshotLabel}" zapisana.`, "success");
      setIsSnapshotModalOpen(false);
      setSnapshotLabel('');
    } catch (error) {
      console.error("Błąd snapshotu:", error);
      const isUnauthorized = error.response?.status === 401;
      
      addToast(
        isUnauthorized ? "Sesja wygasła. Zaloguj się ponownie." : "Nie udało się zapisać wersji.", 
        "error"
      ); 

      if (isUnauthorized) {
        const currentPath = window.location.pathname;
        setTimeout(() => navigate(`${APP_ROUTES.LOGIN}?returnTo=${encodeURIComponent(currentPath)}`), 2000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectHistoryItem = async (id) => {
    setIsSaving(true);
    try {
      await saveToBackend();
      const snapshot = await decisionApi.getSnapshot(currentProjectId, id);
      let rawContent = snapshot.content;
      if (typeof rawContent === 'string') {
         try { rawContent = JSON.parse(rawContent); } catch(e){}
      }
      
      loadScenarioFn(rawContent || {});
      enterPreviewMode(id);

      addToast(`Podgląd wersji: ${snapshot.label || 'Nieznana'}`, "info");
    } catch (error) {
      console.error("Błąd wczytywania snapshotu:", error);
      addToast("Nie udało się wczytać wersji z serwera.", "error");
    } finally {
      setIsSaving(false);
      setIsHistoryOpen(false); 
    }
  };

  const handleRestoreVersion = async () => {
    exitPreviewMode();
    setGlobalDirty(true);
    await saveToBackend();
    addToast("Wersja została przywrócona.", "success");
  };

  const handleClosePreview = async () => {
    try {
      const original = await decisionApi.getProject(currentProjectId);
      let rawContent = original.content;
      if (typeof rawContent === 'string') {
        try { rawContent = JSON.parse(rawContent); } catch(e){}
      }
      
      loadScenarioFn(rawContent || {});
      exitPreviewMode();
    } catch(e) {
       addToast("Błąd podczas wracania do aktualnej wersji.", "error");
    }
  };

  return {
    isHistoryOpen, setIsHistoryOpen,
    isCreateModalOpen, setIsCreateModalOpen,
    isSnapshotModalOpen, setIsSnapshotModalOpen,
    // toast, setToast zostały usunięte z return
    historyItems,
    isSaving, setIsSaving,
    newProjectData, setNewProjectData,
    snapshotLabel, setSnapshotLabel,
    handleSaveClick,
    handleCreateProject,
    handleCreateSnapshot,
    handleSelectHistoryItem,
    handleRestoreVersion,
    handleClosePreview
  };
}