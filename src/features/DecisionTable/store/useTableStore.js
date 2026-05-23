import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { scalePresets } from '../data/scalePresets'; 
import { tableScenarios } from '../data/tableScenarios.js'; 
import { decisionApi } from '../../../api/decisionApi.js'; 
import { NODE_TYPES, EVALUATION_MODES, SORT_DIRECTIONS } from '../../../constants/decisionTypes';
import { useToastStore } from '../../../store/useToastStore.js';
import { buildTableAnalysisPayload } from '../logic/tablePayloadBuilder.js';

const DEFAULT_SCENARIO = tableScenarios.developerHiring;

const initialTableState = {
  alternatives: DEFAULT_SCENARIO.alternatives,
  objectives: DEFAULT_SCENARIO.objectives,
  cells: DEFAULT_SCENARIO.cells,
  originalCells: {},
  objectiveUnits: DEFAULT_SCENARIO.objectiveUnits || {},
  sortDirections: DEFAULT_SCENARIO.sortDirections || {},
  showRanking: true, 
  showTradeoffs: false,
  hideEqualizedObjectives: false,
  rejectedAlternatives: [],
  showRejected: false,
  activePreset: 'jakość / standard',
  customScales: [...scalePresets['jakość / standard']], 
  isDirty: false, 
  isLoading: false, 
  isCalculating: false,
  backendWarnings: [],
  loadError: null,
  dataVersion: 0,          // OCC token — inkrementowany przy każdej edycji danych
  backendAnalysisResult: null, // ostatni wynik z backendu (nadpisuje lokalny)

  // --- AUTO-SAVE STATE ---
  currentProjectId: null,
  isSaving: false,
  saveError: null,

  // --- TIME MACHINE (PREVIEW) STATE ---
  isPreviewMode: false,
  previewingSnapshotId: null,
};

// ... importy i initialTableState pozostają bez zmian na górze pliku ...

export const useTableStore = create()(
  persist(
    (set, get) => {
      
      // HELPER: DRY - automatycznie podbija flagę zapisu i token OCC
      const withDirty = (state, updates) => ({
        ...updates,
        isDirty: true,
        dataVersion: state.dataVersion + 1,
        backendAnalysisResult: null,
        backendWarnings: []
      });

      return {
        ...initialTableState,

        enterPreviewMode: (snapshotId) => set({ isPreviewMode: true, previewingSnapshotId: snapshotId, isDirty: false }),
        exitPreviewMode: () => set({ isPreviewMode: false, previewingSnapshotId: null }),
        setCurrentProject: (id) => set({ currentProjectId: id }),

        saveToBackend: async () => {
          const state = get();
          if (!state.currentProjectId || state.isSaving || state.isPreviewMode) return; 

          set({ isSaving: true, saveError: null });
          try {
            await decisionApi.saveTable(state.currentProjectId, {
              alternatives: state.alternatives,
              objectives: state.objectives,
              cells: state.cells,
              objectiveUnits: state.objectiveUnits,
              sortDirections: state.sortDirections
            });
            set({ isDirty: false, isSaving: false });
          } catch (error) {
            set({ saveError: error.message || "Błąd zapisu", isSaving: false });
          }
        },

        // --- REMOTE DATA FETCHING ---
        loadTemplateScenario: async (templateId) => {
          set({ isLoading: true });
          try {
            const data = await decisionApi.getTableTemplate(templateId);
            get().loadScenario(data, { clearProjectId: true })
          } catch (error) {
            console.error("Błąd ładowania szablonu tabeli:", error);
          } finally {
            set({ isLoading: false });
          }
        },

        loadCloudProject: async (projectId) => {
          set({ isLoading: true, loadError: null }); 
          try {
            const project = await decisionApi.getProject(projectId);
            let rawContent = project.content;
            if (typeof rawContent === 'string') {
              try { rawContent = JSON.parse(rawContent); } 
              catch (e) { console.warn("Nie udało się sparsować contentu", e); }
            }
            const safeContent = rawContent || {};

            get().loadScenario(safeContent); 
            set({ currentProjectId: projectId });
          } catch (error) {
            console.error("Błąd ładowania projektu tabeli z bazy:", error);
            const message = error.response?.status === 403
              ? 'Brak dostępu do tej decyzji.'
              : error.response?.status === 404
                ? 'Decyzja nie istnieje lub została usunięta.'
                : 'Błąd połączenia z serwerem.';
            set({ loadError: message }); 
          } finally {
            set({ isLoading: false });
          }
        },

        analyzeWithBackend: async () => {
          const state = get();
          if (state.isCalculating) return;

          // --- 1. PRE-WALIDACJA FRONTENDOWA (FAIL-FAST) ---
          const hasEmptyObjectives = state.objectives.some(name => !name || name.trim() === '');
          const hasEmptyAlternatives = state.alternatives.some(name => !name || name.trim() === '');

          if (hasEmptyObjectives || hasEmptyAlternatives) {
            useToastStore.getState().addToast(
              'Uzupełnij wszystkie nazwy celów i alternatyw przed analizą serwerową.',
              'error'
            );
            return;
          }
          // ------------------------------------------------

          const snapshotDataVersion = state.dataVersion;
          
          // --- 2. ABORT CONTROLLER (TIMEOUT 30s) ---
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30_000); 

          set({ isCalculating: true, backendWarnings: [] });

          try {
            const payload = buildTableAnalysisPayload(state);
            const result = await decisionApi.analyzeTable(payload, controller.signal);

            if (get().dataVersion !== snapshotDataVersion) {
              console.warn('Odrzucono przestarzałą odpowiedź analizy tabeli (dane zmienione przez użytkownika).');
              return;
            }
            const hasWarnings = result.warnings && result.warnings.length > 0;

            set({
              backendAnalysisResult: result,
              backendWarnings: result.warnings || [],
              isDirty: true,
            });

            if (!hasWarnings) {
              const winnerName = result.winnerIndex !== null ? state.alternatives[result.winnerIndex] : null;
              useToastStore.getState().addToast(
                winnerName
                  ? `Analiza serwera zakończona. Zwycięzca: ${winnerName}`
                  : 'Analiza serwera zakończona. Brak jednoznacznego zwycięzcy.',
                'success'
              );
            }
          } catch (error) {
            console.error('Błąd analizy tabeli na backendzie:', error);
            
            // --- 3. OSTRZEŻENIE 5: CZYSZCZENIE PRZESTARZAŁEGO STANU ---
            // Wymuszamy powrót do wyników lokalnych, żeby UI nie pokazywało "duchów" z poprzedniej analizy.
            set({ backendAnalysisResult: null, backendWarnings: [] });
            
            if (error.name === 'CanceledError' || error.name === 'AbortError') {
              useToastStore.getState().addToast('Analiza przekroczyła limit czasu (30s). Powrócono do wyników lokalnych.', 'error');
            } else {
              useToastStore.getState().addToast('Błąd weryfikacji serwera. Powrócono do wyników lokalnych.', 'error');
            }
          } finally {
              clearTimeout(timeoutId);
              set({ isCalculating: false });
          }
        },
        // --- UI & State Actions (Z uzyciem withDirty DRY) ---
        toggleTradeoffs: () => set((state) => {
          if (!state.showTradeoffs) return { showTradeoffs: true, originalCells: { ...state.cells }, showRanking: false };
          return { showTradeoffs: false, originalCells: {} };
        }),
        toggleRanking: () => set((state) => ({ showRanking: !state.showRanking, showTradeoffs: !state.showRanking ? false : state.showTradeoffs })),
        toggleShowRejected: () => set((state) => ({ showRejected: !state.showRejected })),
        toggleHideEqualized: () => set((state) => ({ hideEqualizedObjectives: !state.hideEqualizedObjectives })),

        addAlternative: () => set((state) => withDirty(state, { alternatives: [...state.alternatives, `Alternatywa ${state.alternatives.length + 1}`] })), 
        addObjective: () => set((state) => withDirty(state, { objectives: [...state.objectives, `Cel ${state.objectives.length + 1}`] })), 
        
        updateAlternative: (index, value) => set((state) => {
          const newAlts = [...state.alternatives];
          newAlts[index] = value;
          return withDirty(state, { alternatives: newAlts }); 
        }),

        removeAlternative: (indexToRemove) => set((state) => {
          const newAlternatives = state.alternatives.filter((_, i) => i !== indexToRemove);
          const newCells = {};
          const newOriginalCells = {};
          for (let r = 0; r < state.objectives.length; r++) {
            for (let c = 0; c < state.alternatives.length; c++) {
              if (c === indexToRemove) continue;
              const newC = c > indexToRemove ? c - 1 : c;
              if (state.cells[`${r}-${c}`] !== undefined) newCells[`${r}-${newC}`] = state.cells[`${r}-${c}`];
              if (state.originalCells[`${r}-${c}`] !== undefined) newOriginalCells[`${r}-${newC}`] = state.originalCells[`${r}-${c}`];
            }
          }
          return withDirty(state, {
            alternatives: newAlternatives,
            cells: newCells,
            originalCells: newOriginalCells,
            rejectedAlternatives: state.rejectedAlternatives.filter((c) => c !== indexToRemove).map((c) => (c > indexToRemove ? c - 1 : c))
          });
        }),

        removeObjective: (indexToRemove) => set((state) => {
          const newObjectives = state.objectives.filter((_, i) => i !== indexToRemove);
          const newCells = {};
          const newOriginalCells = {};
          for (let r = 0; r < state.objectives.length; r++) {
            if (r === indexToRemove) continue;
            const newR = r > indexToRemove ? r - 1 : r;
            for (let c = 0; c < state.alternatives.length; c++) {
              if (state.cells[`${r}-${c}`] !== undefined) newCells[`${newR}-${c}`] = state.cells[`${r}-${c}`];
              if (state.originalCells[`${r}-${c}`] !== undefined) newOriginalCells[`${newR}-${c}`] = state.originalCells[`${r}-${c}`];
            }
          }
          const newSortDirections = {};
          Object.keys(state.sortDirections).forEach((key) => {
            const k = parseInt(key);
            if (k === indexToRemove) return;
            newSortDirections[k > indexToRemove ? k - 1 : k] = state.sortDirections[k];
          });
          const newObjectiveUnits = {};
          Object.keys(state.objectiveUnits).forEach((key) => {
            const k = parseInt(key);
            if (k === indexToRemove) return;
            newObjectiveUnits[k > indexToRemove ? k - 1 : k] = state.objectiveUnits[k];
          });
          
          return withDirty(state, { objectives: newObjectives, cells: newCells, originalCells: newOriginalCells, sortDirections: newSortDirections, objectiveUnits: newObjectiveUnits });
        }),

        updateObjective: (index, value) => set((state) => {
          const newObjs = [...state.objectives];
          newObjs[index] = value;
          return withDirty(state, { objectives: newObjs }); 
        }),

        updateCell: (row, col, value) => set((state) => {
          const key = `${row}-${col}`;
          const newCells = { ...state.cells, [key]: value };
          const newOriginal = { ...state.originalCells };
          if (state.showTradeoffs && state.originalCells[key] === undefined && state.cells[key] !== undefined) {
            newOriginal[key] = state.cells[key];
          }
          return withDirty(state, { cells: newCells, originalCells: newOriginal }); 
        }),

        updateUnit: (row, value) => set((state) => withDirty(state, { objectiveUnits: { ...state.objectiveUnits, [row]: value } })), 
        
        toggleSortDirection: (row) => set((state) => withDirty(state, {
          sortDirections: { ...state.sortDirections, [row]: state.sortDirections[row] === SORT_DIRECTIONS.LOWER ? SORT_DIRECTIONS.HIGHER : SORT_DIRECTIONS.LOWER }
        })),
        
        rejectAlternative: (index) => set((state) => withDirty(state, {
          rejectedAlternatives: state.rejectedAlternatives.includes(index) ? state.rejectedAlternatives : [...state.rejectedAlternatives, index]
        })),

        restoreAlternative: (index) => set((state) => withDirty(state, {
          rejectedAlternatives: state.rejectedAlternatives.filter(i => i !== index)
        })),

        // --- PRESET & SCALE MANAGEMENT ---
        loadPreset: (presetKey) => set((state) => {
          const newPresetData = scalePresets[presetKey] || [];
          const allPresetWords = Object.values(scalePresets).flat().map(p => p.word);
          const userAddedScales = state.customScales.filter(s => s.isAdded === true || !allPresetWords.includes(s.word));
          const combined = [...newPresetData, ...userAddedScales];
          const uniqueMap = new Map();
          combined.forEach(item => uniqueMap.set(item.word, item));

          return withDirty(state, { customScales: Array.from(uniqueMap.values()), activePreset: presetKey });
        }),
     
        addScale: (word, rank) => set((state) => withDirty(state, { 
          customScales: [...state.customScales, { word, rank, isAdded: true }], 
          activePreset: null 
        })),
        
        
        removeScale: (index) => set((state) => withDirty(state, { 
          customScales: state.customScales.filter((_, i) => i !== index), 
          activePreset: null 
        })),
        
      
        clearScales: () => set((state) => withDirty(state, { 
          customScales: [], 
          activePreset: null 
        })),
        // --- LOAD & RESET ---
      loadScenario: (scenario, { clearProjectId = false } = {}) => set((state) => ({
          alternatives: scenario.alternatives || [],
          objectives: scenario.objectives || [],
          cells: scenario.cells || {},
          objectiveUnits: scenario.objectiveUnits || {},
          sortDirections: scenario.sortDirections || {},
          rejectedAlternatives: [],
          showTradeoffs: false,
          showRanking: false,
          isDirty: false,
          backendAnalysisResult: null,
          backendWarnings: [], // czyścimy ostrzeżenia z poprzedniego stanu
          dataVersion: state.dataVersion + 1, // <-- KLUCZOWE: Podbijamy wersję dla OCC!
          ...(clearProjectId && { currentProjectId: null, isPreviewMode: false, previewingSnapshotId: null }) 
        })),
        
        resetAll: () => set((state) => ({ 
          ...initialTableState, 
          ...tableScenarios.blank,     
          showRanking: false,           
          showTradeoffs: false,         
          backendAnalysisResult: null,
          backendWarnings: [],
          rejectedAlternatives: [],
          currentProjectId: null,
          isDirty: false,
          dataVersion: state.dataVersion + 1 
        })),
      };
    },
    {
      name: 'table-storage', 
      partialize: (state) => ({
        alternatives: state.alternatives,
        objectives: state.objectives,
        cells: state.cells,
        objectiveUnits: state.objectiveUnits,
        sortDirections: state.sortDirections,
        customScales: state.customScales,
        activePreset: state.activePreset,
        showTradeoffs: state.showTradeoffs,
        showRanking: state.showRanking,
        hideEqualizedObjectives: state.hideEqualizedObjectives,
        rejectedAlternatives: state.rejectedAlternatives,
      }),
    }
  )
);