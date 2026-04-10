import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { scalePresets } from '../data/scalePresets'; 

// 1. Definiujemy czysty, startowy stan tabeli
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
  isDirty: false, // <--- DODANE: Flaga "Brudnego Stanu"
};

export const useTradeoffStore = create()(
  persist(
    (set) => ({
      ...blankState,

      // --- AKCJE UI (One nie brudzą stanu, to tylko widoki) ---
      toggleTradeoffs: () => set((state) => {
        if (!state.showTradeoffs) return { showTradeoffs: true, originalCells: { ...state.cells }, showRanking: false };
        return { showTradeoffs: false, originalCells: {} };
      }),
      toggleRanking: () => set((state) => ({ showRanking: !state.showRanking, showTradeoffs: !state.showRanking ? false : state.showTradeoffs })),
      toggleShowRejected: () => set((state) => ({ showRejected: !state.showRejected })),
      toggleHideEqualized: () => set((state) => ({ hideEqualizedObjectives: !state.hideEqualizedObjectives })),

      // --- AKCJE DANYCH (Te akcje BRUDZĄ stan) ---
      addAlternative: () => set((state) => ({ alternatives: [...state.alternatives, `Alternatywa ${state.alternatives.length + 1}`], isDirty: true })), // <--- DODANE isDirty
      
      addObjective: () => set((state) => ({ objectives: [...state.objectives, `Cel ${state.objectives.length + 1}`], isDirty: true })), // <--- DODANE isDirty
      
      updateAlternative: (index, value) => set((state) => {
        const newAlts = [...state.alternatives];
        newAlts[index] = value;
        return { alternatives: newAlts, isDirty: true }; // <--- DODANE isDirty
      }),
      updateObjective: (index, value) => set((state) => {
        const newObjs = [...state.objectives];
        newObjs[index] = value;
        return { objectives: newObjs, isDirty: true }; // <--- DODANE isDirty
      }),
      updateCell: (row, col, value) => set((state) => {
        const key = `${row}-${col}`;
        const newCells = { ...state.cells, [key]: value };
        const newOriginal = { ...state.originalCells };
        if (state.showTradeoffs && state.originalCells[key] === undefined && state.cells[key] !== undefined) {
          newOriginal[key] = state.cells[key];
        }
        return { cells: newCells, originalCells: newOriginal, isDirty: true }; // <--- DODANE isDirty
      }),
      updateUnit: (row, value) => set((state) => ({ objectiveUnits: { ...state.objectiveUnits, [row]: value }, isDirty: true })), // <--- DODANE isDirty
      
      toggleSortDirection: (row) => set((state) => ({
        sortDirections: { ...state.sortDirections, [row]: state.sortDirections[row] === 'lower' ? 'higher' : 'lower' },
        isDirty: true // <--- DODANE isDirty
      })),
      
      rejectAlternative: (index) => set((state) => ({
        rejectedAlternatives: state.rejectedAlternatives.includes(index) ? state.rejectedAlternatives : [...state.rejectedAlternatives, index],
        isDirty: true // <--- DODANE isDirty
      })),
      restoreAlternative: (index) => set((state) => ({
        rejectedAlternatives: state.rejectedAlternatives.filter(i => i !== index),
        isDirty: true // <--- DODANE isDirty
      })),

      // --- AKCJE USTAWIEŃ SKALI ---
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
      
      // --- WCZYTYWANIE / RESETOWANIE (Te akcje CZYSZCZĄ stan) ---
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
        equalizedObjectives: {},
        isDirty: false // <--- CZYSTO po wczytaniu
      }),
      
      resetAll: () => set({ ...blankState }), // blankState ma isDirty: false
      
    }),
    {
      name: 'smart-choices-storage-v2', 
    }
  )
);