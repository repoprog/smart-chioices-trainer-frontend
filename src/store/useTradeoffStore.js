import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const scalePresets = {
  'Jakość / Standard': [{ word: 'niski', rank: '1', isAdded: false }, { word: 'średni', rank: '2', isAdded: false }, { word: 'wysoki', rank: '3', isAdded: false }],
  'Priorytet': [{ word: 'niski', rank: '1', isAdded: false }, { word: 'normalny', rank: '2', isAdded: false }, { word: 'pilny', rank: '3', isAdded: false }, { word: 'krytyczny', rank: '4', isAdded: false }],
  'Szkolny (1-6)': [{ word: 'niedostateczny', rank: '1', isAdded: false }, { word: 'dopuszczający', rank: '2', isAdded: false }, { word: 'dostateczny', rank: '3', isAdded: false }, { word: 'dobry', rank: '4', isAdded: false }, { word: 'bardzo dobry', rank: '5', isAdded: false }, { word: 'celujący', rank: '6', isAdded: false }],
  'Tak / Nie': [{ word: 'tak', rank: '1', isAdded: false }, { word: 'nie', rank: '0', isAdded: false }]
};

export const useTradeoffStore = create()(
  persist(
    (set) => ({
      alternatives: ['Biuro A', 'Biuro B', 'Biuro C'],
      objectives: ['Czynsz', 'Metraż', 'Czas dojazdu', 'Standard wyposażenia'],
      cells: {},
      objectiveUnits: {},
      showRanking: false,
      sortDirections: {},
      showTradeoffs: false,
      originalCells: {},
      hideEqualizedObjectives: false,
      rejectedAlternatives: [],
      showRejected: false,
      customScales: scalePresets['Jakość / Standard'],
      activePreset: 'Jakość / Standard',

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
      loadPreset: (presetKey) => set({ customScales: scalePresets[presetKey], activePreset: presetKey }),
      addScale: (word, rank) => set((state) => ({
        customScales: [...state.customScales, { word, rank, isAdded: true }],
        activePreset: null
      })),
      removeScale: (index) => set((state) => ({
        customScales: state.customScales.filter((_, i) => i !== index),
        activePreset: null
      })),
      clearScales: () => set({ customScales: [], activePreset: null }),
      
      resetAll: () => {
        set({ alternatives: [], objectives: [], cells: {}, originalCells: {}, rejectedAlternatives: [] });
      }
    }),
    {
      name: 'smart-choices-storage', // unikalna nazwa w localStorage
    }
  )
);