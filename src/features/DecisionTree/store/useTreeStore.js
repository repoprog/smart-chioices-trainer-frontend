import { create, useStore } from 'zustand';
import { temporal } from 'zundo';
import { persist } from 'zustand/middleware'; // <-- Dodany import
import { treeScenarios } from '../data/treeScenarios.js';
import { decisionApi } from '../../../api/decisionApi.js'; 

// CORE MECHANIC: Visual layout and graph traversal utilities
import {
  collectDescendants,
  nextDomId,
  renumberDecisionAndChanceNodes,
  getLayoutedElements,
  syncColumnLabels 
} from '../logic/treeUtils.js';

// CORE MECHANIC: Pure mathematical engines for EMV and probability
import { 
  evaluateAndSetWinningPath, 
  rebalanceProbabilities, 
  formatProbability 
} from '../logic/treeAlgorithms.js';

const defaultScenario = treeScenarios.basketball || { nodes: [], edges: [], labels: [] };
const layoutedInitial = getLayoutedElements(defaultScenario.nodes, defaultScenario.edges);
const numberedInitial = renumberDecisionAndChanceNodes(layoutedInitial, defaultScenario.edges);
const initialStageLabels = syncColumnLabels(numberedInitial, defaultScenario.edges, defaultScenario.labels || []);

export const useTreeStore = create()(
  persist(
    temporal((set, get) => ({
      nodes: numberedInitial,
      edges: defaultScenario.edges,
      stageColumnLabels: initialStageLabels,
      evaluationMode: 'max',
      evaluationMap: {},
      winningPath: new Set(),
      isDirty: false, 
      isLoading: false, 
      isSimulationMode: false, // <-- NOWY STAN: Domyślnie matematyka jest ukryta

      
      loadRemoteTreeScenario: async (id) => {
        set({ isLoading: true });
        try {
          const data = await decisionApi.getTreeById(id);
          get().loadScenario(data.nodes || [], data.edges || [], data.labels || []);
        } catch (error) {
          console.error("Błąd podczas ładowania scenariusza drzewa:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      // --- LOAD & RESET ---
      loadScenario: (newNodes, newEdges, newLabels = []) =>
        set((state) => {
          const layoutedNodes = getLayoutedElements(newNodes, newEdges);
          const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, newEdges);
          const stageColumnLabels = syncColumnLabels(renumbered, newEdges, newLabels);

          const newState = {
            ...state,
            nodes: renumbered,
            edges: newEdges,
            stageColumnLabels,
            isDirty: false
          };
          return evaluateAndSetWinningPath(newState);
        }),

      resetTree: () => set((state) => {
        const newState = { ...state, nodes: [], edges: [], stageColumnLabels: [], isDirty: false };
        return evaluateAndSetWinningPath(newState);
      }),

      // --- USER ACTIONS ---
      setEvaluationMode: (mode) => set((state) => evaluateAndSetWinningPath({ ...state, evaluationMode: mode, isDirty: true })),

      setStageColumnLabel: (index, text) =>
        set((state) => {
          const next = [...state.stageColumnLabels];
          if (index < 0) return state;
          while (next.length <= index) next.push('');
          next[index] = text;
          return { stageColumnLabels: next, isDirty: true };
        }),

      updateEdgeData: (edgeId, patch) =>
        set((state) => {
          const newState = {
            ...state,
            edges: state.edges.map((e) => e.id === edgeId ? { ...e, data: { ...e.data, ...patch } } : e),
            isDirty: true
          };
          return evaluateAndSetWinningPath(newState);
        }),

      toggleEdgesCost: (sourceNodeId) =>
        set((state) => {
          const firstEdge = state.edges.find((e) => e.source === sourceNodeId);
          const willShow = firstEdge ? !firstEdge.data?.showCost : true;

          const newState = {
            ...state,
            edges: state.edges.map((e) =>
              e.source === sourceNodeId ? { ...e, data: { ...e.data, showCost: willShow, localShowCost: false } } : e
            ),
            isDirty: true
          };
          return evaluateAndSetWinningPath(newState);
        }),

      updateNodeData: (nodeId, patch) =>
        set((state) => {
           const newState = {
            ...state,
            nodes: state.nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n),
            isDirty: true
          };
          return evaluateAndSetWinningPath(newState);
        }),

      setEdgeProbability: (edgeId, newProbabilityValue) =>
        set((state) => {
          let allEdges = [...state.edges];
          const editedEdgeIndex = allEdges.findIndex((e) => e.id === edgeId);
          if (editedEdgeIndex === -1) return state;

          const editedEdge = allEdges[editedEdgeIndex];
          const sourceNodeId = editedEdge.source;
          let newProb = Math.max(0, newProbabilityValue);

          allEdges[editedEdgeIndex] = {
            ...editedEdge,
            data: { ...editedEdge.data, probability: formatProbability(newProb), isLocked: true },
          };
          
          const updatedEdges = rebalanceProbabilities(allEdges, sourceNodeId);
          const newState = { ...state, edges: updatedEdges, isDirty: true };
          return evaluateAndSetWinningPath(newState);
        }),

      toggleEdgeAutoBalance: (edgeId) =>
        set((state) => {
          let allEdges = [...state.edges];
          const edgeIndex = allEdges.findIndex((e) => e.id === edgeId);
          if (edgeIndex === -1) return state;

          const edge = allEdges[edgeIndex];
          const isCurrentlyLocked = edge.data?.isLocked;

          allEdges[edgeIndex] = {
            ...edge,
            data: { ...edge.data, isLocked: !isCurrentlyLocked },
          };

          if (isCurrentlyLocked) {
            allEdges = rebalanceProbabilities(allEdges, edge.source);
          }

          const newState = { ...state, edges: allEdges, isDirty: true };
          return evaluateAndSetWinningPath(newState);
        }),

        
      toggleSimulationMode: () =>
        set((state) => {
          const newMode = !state.isSimulationMode;

          
          if (!newMode) {
            return { isSimulationMode: false };
          }

          
          const chanceNodeIds = new Set(state.nodes.filter(n => n.type === 'chance').map(n => n.id));
          let hasChanges = false;
          
          const newEdges = state.edges.map(edge => {
            if (chanceNodeIds.has(edge.source) && edge.data?.isLocked !== false) {
              hasChanges = true;
              return { ...edge, data: { ...edge.data, isLocked: false } };
            }
            return edge;
          });

          
          if (!hasChanges) {
            return { isSimulationMode: true };
          }

          const newState = { ...state, edges: newEdges, isSimulationMode: true, isDirty: true };
          return evaluateAndSetWinningPath(newState);
        }),

      addBranch: (parentId, childKind) =>
        set((state) => {
          const parent = state.nodes.find((n) => n.id === parentId);
          if (!parent || (parent.type !== 'decision' && parent.type !== 'chance')) return state;

          const newNodeId = nextDomId(childKind === 'chance' ? 'c' : 't');
          const existingOutgoing = state.edges.filter((e) => e.source === parentId);
          const isFromChance = parent.type === 'chance';
          let edgeData = isFromChance 
            ? { optionLabel: `Zdarzenie ${existingOutgoing.length + 1}`, probability: '0%', isLocked: false }
            : { optionLabel: `Opcja ${existingOutgoing.length + 1}`, probability: null };

          const newNode = {
            id: newNodeId,
            type: childKind,
            position: { x: 0, y: 0 }, 
            zIndex: 100,
            data: childKind === 'terminal' ? { payoff: '0 zł' } : { nodeNumber: 0 },
          };

          const newEdge = { id: nextDomId('e'), source: parentId, target: newNodeId, type: 'smartChoices', data: edgeData };

          let edgesWithNew = [...state.edges, newEdge];
          if (isFromChance) {
            edgesWithNew = rebalanceProbabilities(edgesWithNew, parentId);
          }

          const nodesWithNew = [...state.nodes, newNode];
          const layoutedNodes = getLayoutedElements(nodesWithNew, edgesWithNew);
          const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, edgesWithNew);
          const stageColumnLabels = syncColumnLabels(renumbered, edgesWithNew, state.stageColumnLabels);

          const newState = {
            ...state,
            nodes: renumbered,
            edges: edgesWithNew,
            stageColumnLabels,
            isDirty: true
          };
          return evaluateAndSetWinningPath(newState);
        }),

       removeNode: (nodeId) =>
        set((state) => {
          const incomingEdge = state.edges.find((e) => e.target === nodeId);
          if (!incomingEdge) return state; 
          const removeSet = collectDescendants(nodeId, state.edges);
          removeSet.add(nodeId); 

          const parentId = incomingEdge.source;
          let remainingEdges = state.edges.filter((e) => !removeSet.has(e.source) && !removeSet.has(e.target));

          const parent = state.nodes.find((n) => n.id === parentId);
          if (parent && parent.type === 'chance') {
            remainingEdges = rebalanceProbabilities(remainingEdges, parentId);
          }
          
          const remainingNodes = state.nodes.filter((n) => !removeSet.has(n.id));
          const layoutedNodes = getLayoutedElements(remainingNodes, remainingEdges);
          const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, remainingEdges);
          const stageColumnLabels = syncColumnLabels(renumbered, remainingEdges, state.stageColumnLabels);
          
          const newState = {
            ...state,
            nodes: renumbered,
            edges: remainingEdges,
            stageColumnLabels,
            isDirty: true
          };

          return evaluateAndSetWinningPath(newState);
        }),

      swapNodeType: (nodeId, newType) =>
        set((state) => {
          const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
          if (nodeIndex === -1) return state;
          const node = state.nodes[nodeIndex];
          if (node.type === newType) return state;

          let remainingNodes = [...state.nodes];
          let remainingEdges = [...state.edges];

          if (newType === 'terminal') {
            const removeSet = collectDescendants(nodeId, state.edges);
            removeSet.delete(nodeId); 
            remainingNodes = remainingNodes.filter((n) => !removeSet.has(n.id));
            remainingEdges = remainingEdges.filter((e) => !removeSet.has(e.source) && !removeSet.has(e.target) && e.source !== nodeId);
          }

          const targetIndex = remainingNodes.findIndex((n) => n.id === nodeId);
          if (targetIndex === -1) return state; 
          
          const oldData = remainingNodes[targetIndex].data;
          let newData = { ...oldData };
          if (newType === 'terminal') {
            newData = { payoff: oldData.payoff || '0 zł' };
            delete newData.nodeNumber;
          } else {
            newData = { nodeNumber: oldData.nodeNumber || 0 };
            delete newData.payoff;
          }

          remainingNodes[targetIndex] = { ...remainingNodes[targetIndex], type: newType, data: newData };

          if (newType !== 'terminal') {
            remainingEdges = remainingEdges.map((e) => {
              if (e.source === nodeId) {
                if (newType === 'decision') return { ...e, data: { ...e.data, probability: null, isLocked: false } };
                if (newType === 'chance') return { ...e, data: { ...e.data, probability: '0%', isLocked: false } };
              }
              return e;
            });
            
            if (newType === 'chance') {
              remainingEdges = rebalanceProbabilities(remainingEdges, nodeId);
            }
          }

          const layoutedNodes = getLayoutedElements(remainingNodes, remainingEdges);
          const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, remainingEdges);
          const stageColumnLabels = syncColumnLabels(renumbered, remainingEdges, state.stageColumnLabels);

          const newState = { ...state, nodes: renumbered, edges: remainingEdges, stageColumnLabels, isDirty: true };
          return evaluateAndSetWinningPath(newState);
        }),

      importJson: (jsonString) =>
        set((state) => {
          try {
            const parsed = JSON.parse(jsonString);
            if (parsed.nodes && parsed.edges) {
              const layoutedNodes = getLayoutedElements(parsed.nodes, parsed.edges);
              const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, parsed.edges);
              const stageColumnLabels = syncColumnLabels(renumbered, parsed.edges, parsed.stageColumnLabels || []);

              const newState = {
                ...state,
                nodes: renumbered,
                edges: parsed.edges,
                stageColumnLabels,
                isDirty: false
              };
              return evaluateAndSetWinningPath(newState);
            }
          } catch (e) {
            console.error("Błąd podczas wczytywania pliku JSON", e);
          }
          return state;
        }),
        
      removeBranch: (parentId) =>
        set((state) => {
          const parent = state.nodes.find((n) => n.id === parentId);
          if (!parent) return state;

          const outgoing = state.edges.filter((e) => e.source === parentId);
          if (!outgoing.length) return state;

          const byId = new Map(state.nodes.map((n) => [n.id, n]));
          const sorted = [...outgoing].sort((a, b) => {
            const ya = byId.get(a.target)?.position?.y ?? 0;
            const yb = byId.get(b.target)?.position?.y ?? 0;
            return yb - ya;
          });
          const victimEdge = sorted[0];
          const removeSet = collectDescendants(victimEdge.target, state.edges);

          let remainingEdges = state.edges.filter((e) => e.id !== victimEdge.id && !removeSet.has(e.source) && !removeSet.has(e.target));

          if (parent.type === 'chance') {
            remainingEdges = rebalanceProbabilities(remainingEdges, parentId);
          }
          
          const remainingNodes = state.nodes.filter((n) => !removeSet.has(n.id));
          const layoutedNodes = getLayoutedElements(remainingNodes, remainingEdges);
          const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, remainingEdges);
          const stageColumnLabels = syncColumnLabels(renumbered, remainingEdges, state.stageColumnLabels);
          
          const newState = {
            ...state,
            nodes: renumbered,
            edges: remainingEdges,
            stageColumnLabels,
            isDirty: true
          };
          return evaluateAndSetWinningPath(newState);
        }),
        
      init: () => set(state => evaluateAndSetWinningPath(state)),
    }),
    {
      limit: 50, 
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        stageColumnLabels: state.stageColumnLabels,
        evaluationMode: state.evaluationMode,
        evaluationMap: state.evaluationMap,
        winningPath: Array.from(state.winningPath), 
        
      }),
    }
   ),
   {
     name: 'decision-tree-storage',
     partialize: (state) => ({
       nodes: state.nodes,
       edges: state.edges,
       stageColumnLabels: state.stageColumnLabels,
       evaluationMode: state.evaluationMode,
     }),
   }
  )
);

export const useTemporalTreeStore = (selector) => useStore(useTreeStore.temporal, selector);

useTreeStore.getState().init();
useTreeStore.temporal.getState().clear();