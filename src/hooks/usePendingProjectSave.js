import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { decisionApi } from '../api/decisionApi';
import { STORAGE_KEYS } from '../constants/appConstants'; 
import { useToastStore } from '../store/useToastStore'; 

export function usePendingProjectSave({ 
  expectedType, 
  setCurrentProject, 
  saveToBackend, 
  setIsSaving, 
 
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToast = useToastStore((s) => s.addToast); 

  useEffect(() => {
    const processPendingSave = async () => {
      if (!isAuthenticated) return;
      
     
      const pendingDataStr = sessionStorage.getItem(STORAGE_KEYS.PENDING_SAVE);
      if (!pendingDataStr) return;
      
      try {
        const pendingData = JSON.parse(pendingDataStr);
        // Sprawdzamy, czy jesteśmy w odpowiednim komponencie (TREE lub TABLE)
        if (pendingData.type !== expectedType) return; 

        // Czyścimy pamięć 
        sessionStorage.removeItem(STORAGE_KEYS.PENDING_SAVE);
        setIsSaving(true);
        
        // Tworzymy projekt
        const res = await decisionApi.createProject(pendingData.title, pendingData.type);
        if (pendingData.notes?.trim()) {
          await decisionApi.patchNotes(res.id, pendingData.notes);
        }
        
        // Aktualizujemy stan (korzystając z przekazanych funkcji ze store'a)
        setCurrentProject(res.id);
        await saveToBackend();
        
        // 3. UŻYWAMY addToast ZAMIAST przekazanego callbacka
        addToast("Zapisano przerwaną decyzję!", "success");
      } catch (error) {
        console.error("Błąd automatycznego zapisu:", error);
        addToast("Nie udało się dokończyć zapisu decyzji.", "error");
      } finally {
        setIsSaving(false);
      }
    };
    
    processPendingSave();
  }, [isAuthenticated, expectedType, setCurrentProject, saveToBackend, setIsSaving]);
}