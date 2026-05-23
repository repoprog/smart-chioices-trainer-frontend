import { useState, useEffect, useCallback } from 'react';
import { decisionApi } from '../api/decisionApi';
import { useToastStore } from '../store/useToastStore'; 
import { NODE_TYPES } from '../constants/decisionTypes';

import { APP_ROUTES, STORAGE_KEYS } from '../constants/appConstants';
// DODANE: AuthStore
import useAuthStore from '../store/useAuthStore';

export function useCloudProjectActions({
  projectType,
  currentProjectId,
  setCurrentProject,
  saveToBackend,
  loadScenarioFn,
  enterPreviewMode,
  exitPreviewMode,
  getCurrentStateFn,
  setGlobalDirty 
}) {
  const addToast = useToastStore(s => s.addToast); 
  // ZMIANA: Wyciągamy dane sesji i funkcję otwierającą Modal z Zustanda
  const { isAuthenticated, openLoginModal } = useAuthStore();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);

  // Data States
  const [historyItems, setHistoryItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [previewCache, setPreviewCache] = useState(null);

  // --- NOWOŚĆ: Stan pamięci intencji (Intent Caching) bez sessionStorage ---
  const [pendingSave, setPendingSave] = useState(false);

  // --- EFEKT: Nasłuchuje udanego logowania i automatycznie kontynuuje zapis ---
  useEffect(() => {
    if (isAuthenticated && pendingSave) {
      setPendingSave(false); 
      
      if (currentProjectId) {
        setIsSnapshotModalOpen(true);
      } else {
        setIsCreateModalOpen(true);
      }
      
      // Opcjonalnie: Cichy toast informujący, że kontynuujemy zapis
      // addToast("Zalogowano pomyślnie. Kontynuuj zapis.", "success");
    }
  }, [isAuthenticated, pendingSave, currentProjectId]);

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
          tags: s.smartTags || [] 
        }));
        setHistoryItems(mappedHistory);
      } catch (error) {
        console.error("Błąd podczas pobierania snapshotów:", error);
      }
    };
    fetchHistory();
  }, [currentProjectId]);

  const handleSaveClick = () => {
    if (!isAuthenticated) {
      addToast("Twoja praca jest bezpieczna. Zaloguj się, aby przenieść ją do chmury.", "info");
      
      // Uzbrajamy system, aby otworzył modal zapisu zaraz po zalogowaniu
      setPendingSave(true);
      
      openLoginModal(); 
      return; 
    }

    if (currentProjectId) {
      setIsSnapshotModalOpen(true);
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const handleCreateProject = async ({ title, notes }) => {
    if (!title.trim()) return;
    
    setIsSaving(true);
    try {
      const res = await decisionApi.createProject(title, projectType);
      if (notes.trim()) {
        await decisionApi.patchNotes(res.id, notes);
      }
      
      setCurrentProject(res.id);
      await saveToBackend(); 
      
      addToast("Decyzja została utworzona!", "success"); 
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Błąd tworzenia decyzji:", error);
      const isUnauthorized = error.response?.status === 401;
      const isNetworkError = !error.response;
      
      // ZMIANA: Skoro autoryzacja dzieje się wyżej, to 401 znaczy, że wygasł token.
      if (isUnauthorized) {
         addToast("Twoja sesja wygasła. Zaloguj się ponownie.", "error");
         openLoginModal();
      } else {
         addToast(isNetworkError ? "Brak połączenia z serwerem." : "Wystąpił błąd podczas tworzenia decyzji.", "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSnapshot = async (label) => {
    if (!label.trim() || !currentProjectId) return;

    setIsSaving(true);
    try {
      await saveToBackend();
      const newSnapshot = await decisionApi.createSnapshot(currentProjectId, label);
      
      setHistoryItems(prev => [{
        id: newSnapshot.id, 
        title: newSnapshot.label,
        date: newSnapshot.createdAt,
        tags: newSnapshot.smartTags || [] 
      }, ...prev]);

      addToast(`Wersja "${label}" zapisana.`, "success");
      setIsSnapshotModalOpen(false);
    } catch (error) {
      console.error("Błąd snapshotu:", error);
      const isUnauthorized = error.response?.status === 401;
      
      if (isUnauthorized) {
        addToast("Twoja sesja wygasła. Zaloguj się ponownie.", "error");
        openLoginModal();
      } else {
        addToast("Nie udało się zapisać wersji.", "error"); 
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectHistoryItem = async (id) => {
    if (!currentProjectId) {
      addToast('Zapisz projekt w chmurze, aby przeglądać historię.', 'warning');
      setIsHistoryOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      await saveToBackend();
      if (getCurrentStateFn) {
        setPreviewCache(getCurrentStateFn());
      }
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
    setIsSaving(true); 
    try {
      exitPreviewMode();
      
      if (typeof setGlobalDirty === 'function') {
        setGlobalDirty(true);
      }

      await saveToBackend();
      addToast("Wersja przywrócona i zapisana w chmurze.", "success");
    } catch (error) {
      console.error("Błąd przywracania wersji:", error);
      addToast("Błąd połączenia. Nie udało się zapisać przywróconej wersji.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClosePreview = async () => {
    if (previewCache) {
      loadScenarioFn(previewCache);
    } else {
      try {
        const original = await decisionApi.getProject(currentProjectId);
        let rawContent = original.content;
        if (typeof rawContent === 'string') {
          try { rawContent = JSON.parse(rawContent); } catch(e){}
        }
        loadScenarioFn(rawContent || {});
      } catch(e) {
        addToast("Błąd połączenia. Wróciłeś do bieżącej wersji.", "warning");
      }
    }
    
    exitPreviewMode();
    setPreviewCache(null);
  };
    
  return {
    isHistoryOpen, setIsHistoryOpen,
    isCreateModalOpen, setIsCreateModalOpen,
    isSnapshotModalOpen, setIsSnapshotModalOpen,
    historyItems,
    isSaving, setIsSaving,
    handleSaveClick,
    handleCreateProject,
    handleCreateSnapshot,
    handleSelectHistoryItem,
    handleRestoreVersion,
    handleClosePreview
  };
}