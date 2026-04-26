import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { scalePresets } from '../data/scalePresets'; 
import { tableScenarios } from '../data/tableScenarios.js'; 
import { decisionApi } from '../../../api/decisionApi.js'; 
import { NODE_TYPES, EVALUATION_MODES, SORT_DIRECTIONS } from '../../../constants/decisionTypes';


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
};

export const useTableStore = create()(
  persist(
    
    (set, get) => ({ 
      ...initialTableState,

      // --- REMOTE DATA FETCHING ---
      loadRemoteTableScenario: async (id) => {
        set({ isLoading: true });
        try {
          const data = await decisionApi.getTableById(id);
          get().loadScenario(data); 
        } catch (error) {
          console.error("Błąd podczas ładowania scenariusza tabeli:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      // --- UI & State Actions ---
      toggleTradeoffs: () => set((state) => {
        if (!state.showTradeoffs) return { showTradeoffs: true, originalCells: { ...state.cells }, showRanking: false };
        return { showTradeoffs: false, originalCells: {} };
      }),
      toggleRanking: () => set((state) => ({ showRanking: !state.showRanking, showTradeoffs: !state.showRanking ? false : state.showTradeoffs })),
      toggleShowRejected: () => set((state) => ({ showRejected: !state.showRejected })),
      toggleHideEqualized: () => set((state) => ({ hideEqualizedObjectives: !state.hideEqualizedObjectives })),

      addAlternative: () => set((state) => ({ alternatives: [...state.alternatives, `Alternatywa ${state.alternatives.length + 1}`], isDirty: true })), 
      addObjective: () => set((state) => ({ objectives: [...state.objectives, `Cel ${state.objectives.length + 1}`], isDirty: true })), 
      
      updateAlternative: (index, value) => set((state) => {
        const newAlts = [...state.alternatives];
        newAlts[index] = value;
        return { alternatives: newAlts, isDirty: true }; 
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
        
        return {
          alternatives: newAlternatives,
          cells: newCells,
          originalCells: newOriginalCells,
          rejectedAlternatives: state.rejectedAlternatives
            .filter((c) => c !== indexToRemove)
            .map((c) => (c > indexToRemove ? c - 1 : c)),
          isDirty: true,
        };
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
          const newK = k > indexToRemove ? k - 1 : k;
          newSortDirections[newK] = state.sortDirections[k];
        });
        
        const newObjectiveUnits = {};
        Object.keys(state.objectiveUnits).forEach((key) => {
          const k = parseInt(key);
          if (k === indexToRemove) return;
          const newK = k > indexToRemove ? k - 1 : k;
          newObjectiveUnits[newK] = state.objectiveUnits[k];
        });
        
        return {
          objectives: newObjectives,
          cells: newCells,
          originalCells: newOriginalCells,
          sortDirections: newSortDirections,
          objectiveUnits: newObjectiveUnits,
          isDirty: true,
        };
      }),
      updateObjective: (index, value) => set((state) => {
        const newObjs = [...state.objectives];
        newObjs[index] = value;
        return { objectives: newObjs, isDirty: true }; 
      }),
      updateCell: (row, col, value) => set((state) => {
        const key = `${row}-${col}`;
        const newCells = { ...state.cells, [key]: value };
        const newOriginal = { ...state.originalCells };
        if (state.showTradeoffs && state.originalCells[key] === undefined && state.cells[key] !== undefined) {
          newOriginal[key] = state.cells[key];
        }
        return { cells: newCells, originalCells: newOriginal, isDirty: true }; 
      }),
      updateUnit: (row, value) => set((state) => ({ objectiveUnits: { ...state.objectiveUnits, [row]: value }, isDirty: true })), 
      
      toggleSortDirection: (row) => set((state) => ({
        sortDirections: { ...state.sortDirections, [row]: state.sortDirections[row] === SORT_DIRECTIONS.LOWER ? SORT_DIRECTIONS.HIGHER : SORT_DIRECTIONS.LOWER },
        isDirty: true 
      })),
      
      rejectAlternative: (index) => set((state) => ({
        rejectedAlternatives: state.rejectedAlternatives.includes(index) ? state.rejectedAlternatives : [...state.rejectedAlternatives, index],
        isDirty: true 
      })),
      restoreAlternative: (index) => set((state) => ({
        rejectedAlternatives: state.rejectedAlternatives.filter(i => i !== index),
        isDirty: true 
      })),

      // --- PRESET & SCALE MANAGEMENT ---
      loadPreset: (presetKey) => set((state) => {
        const newPresetData = scalePresets[presetKey] || [];
        const allPresetWords = Object.values(scalePresets).flat().map(p => p.word);
        
        const userAddedScales = state.customScales.filter(s => 
          s.isAdded === true || !allPresetWords.includes(s.word)
        );
        const combined = [...newPresetData, ...userAddedScales];
        const uniqueMap = new Map();
        combined.forEach(item => uniqueMap.set(item.word, item));

        return { 
          customScales: Array.from(uniqueMap.values()), 
          activePreset: presetKey,
          isDirty: true 
        };
      }),
      addScale: (word, rank) => set((state) => ({ customScales: [...state.customScales, { word, rank, isAdded: true }], activePreset: null })),
      removeScale: (index) => set((state) => ({ customScales: state.customScales.filter((_, i) => i !== index), activePreset: null })),
      clearScales: () => set({ customScales: [], activePreset: null }),
      
      // --- LOAD & RESET ---
      loadScenario: (scenario) => set({
        alternatives: scenario.alternatives || [],
        objectives: scenario.objectives || [],
        cells: scenario.cells || {},
        objectiveUnits: scenario.objectiveUnits || {},
        sortDirections: scenario.sortDirections || {},
        rejectedAlternatives: [],
        showTradeoffs: false,
        showRanking: false,
        winnerIndex: null,
        isDirty: false 
      }),
      
      resetAll: () => set({ ...initialTableState }), 
    }),
    {
      name: 'smart-choices-storage', 
    }
  )
);