import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { scalePresets } from '../data/scalePresets'; 

// 1. Definiujemy czysty, startowy stan tabeli (tzw. Pusta Karta)
const blankState = {
  alternatives: [],
  objectives: [],
  cells: {},
  originalCells: {},
  objectiveUnits: {},
  sortDirections: {},
  showRanking: false,
  showTradeoffs: false,
  hideEqualizedObjectives: false,
  rejectedAlternatives: [],
  showRejected: false,
  activePreset: 'Jakość / Standard',
  customScales: [...scalePresets['Jakość / Standard']], 
};

export const useTradeoffStore = create()(
  persist(
    (set) => ({
      ...blankState,

      // --- AKCJE UI ---
      toggleTradeoffs: () => set((state) => {
        if (!state.showTradeoffs) {
          return { showTradeoffs: true, originalCells: { ...state.cells }, showRanking: false };
        }
        return { showTradeoffs: false, originalCells: {} };
      }),
      toggleRanking: () => set((state) => ({ 
        showRanking: !state.showRanking, 
        showTradeoffs: !state.showRanking ? false : state.showTradeoffs 
      })),
      toggleShowRejected: () => set((state) => ({ showRejected: !state.showRejected })),
      toggleHideEqualized: () => set((state) => ({ hideEqualizedObjectives: !state.hideEqualizedObjectives })),

      // --- AKCJE DANYCH ---
      addAlternative: () => set((state) => ({ alternatives: [...state.alternatives, `Alternatywa ${state.alternatives.length + 1}`] })),
      
      // TUTAJ BYŁ BŁĄD! Zamiast 'addObjective' miałeś wpisane 'objectives'. Poprawione:
      addObjective: () => set((state) => ({ objectives: [...state.objectives, `Cel ${state.objectives.length + 1}`] })),
      
      updateAlternative: (index, value) => set((state) => {
        const newAlts = [...state.alternatives];
        newAlts[index] = value;
        return { alternatives: newAlts };
      }),
      updateObjective: (index, value) => set((state) => {
        const newObjs = [...state.objectives];
        newObjs[index] = value;
        return { objectives: newObjs };
      }),
      updateCell: (row, col, value) => set((state) => {
        const key = `${row}-${col}`;
        const newCells = { ...state.cells, [key]: value };
        const newOriginal = { ...state.originalCells };
        if (state.showTradeoffs && state.originalCells[key] === undefined && state.cells[key] !== undefined) {
          newOriginal[key] = state.cells[key];
        }
        return { cells: newCells, originalCells: newOriginal };
      }),
      updateUnit: (row, value) => set((state) => ({ objectiveUnits: { ...state.objectiveUnits, [row]: value } })),
      
      toggleSortDirection: (row) => set((state) => ({
        sortDirections: { ...state.sortDirections, [row]: state.sortDirections[row] === 'lower' ? 'higher' : 'lower' }
      })),
      
      rejectAlternative: (index) => set((state) => ({
        rejectedAlternatives: state.rejectedAlternatives.includes(index) ? state.rejectedAlternatives : [...state.rejectedAlternatives, index]
      })),
      restoreAlternative: (index) => set((state) => ({
        rejectedAlternatives: state.rejectedAlternatives.filter(i => i !== index)
      })),

      // --- AKCJE USTAWIEŃ SKALI ---
      loadPreset: (presetKey) => set({
        customScales: [...(scalePresets[presetKey] || [])], 
        activePreset: presetKey
      }),

      addScale: (word, rank) => set((state) => ({
        customScales: [...state.customScales, { word, rank, isAdded: true }],
        activePreset: null
      })),
      removeScale: (index) => set((state) => ({
        customScales: state.customScales.filter((_, i) => i !== index),
        activePreset: null
      })),
      clearScales: () => set({ customScales: [], activePreset: null }),
      
      // --- WCZYTYWANIE / RESETOWANIE ---
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
        equalizedObjectives: {} 
      }),
      
      resetAll: () => set({ ...blankState }),
      
    }),
    {
      // ZMIENIŁEM NAZWĘ BAZY NA v2! To wymusi zresetowanie starej pamięci w przeglądarce
      name: 'smart-choices-storage-v2', 
    }
  )
);