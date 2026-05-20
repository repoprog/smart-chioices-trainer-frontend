import { create, useStore } from 'zustand';
import { temporal } from 'zundo';
import { persist } from 'zustand/middleware'; 
import { treeScenarios } from '../data/treeScenarios.js';
import { decisionApi } from '../../../api/decisionApi.js'; 
import { NODE_TYPES, EVALUATION_MODES } from '../../../constants/decisionTypes.js';
import { buildTreeAnalysisPayload } from '../logic/treePayloadBuilder.js';
import { useToastStore } from '../../../store/useToastStore.js';

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

/**
 * Global State Management for the Decision Tree Editor.
 * Wraps Zustand with 'persist' (for LocalStorage hydration) and 'temporal' (Zundo) for Time-Travel (Undo/Redo).
 * Employs a "Server-Authoritative Hybrid Architecture" where local state is fast/optimistic, 
 * but validated against a Spring Boot backend for complex calculations.
 */
export const useTreeStore = create()(
  persist(
    temporal((set, get) => ({
      nodes: numberedInitial,
      edges: defaultScenario.edges,
      stageColumnLabels: initialStageLabels,
      evaluationMode: EVALUATION_MODES.MAX,
      evaluationMap: {},
      winningPath: [],
      dataVersion: Date.now(),
      isDirty: false, 
      isLoading: false, 
      isSimulationMode: false, 
      isCalculating: false,
      backendWarnings: [],

      // --- AUTO-SAVE STATE ---
      currentProjectId: null,
      isSaving: false,
      saveError: null,
      loadError: null,

      // --- TIME MACHINE (PREVIEW) STATE ---
      isPreviewMode: false,
      previewingSnapshotId: null,

      enterPreviewMode: (snapshotId) => set({ isPreviewMode: true, previewingSnapshotId: snapshotId, isDirty: false }),
      exitPreviewMode: () => set({ isPreviewMode: false, previewingSnapshotId: null }),

      setCurrentProject: (id) => set({ currentProjectId: id }),

      /**
       * Core Integration: Server-Authoritative Math Validation.
       * Uses Optimistic Concurrency Control (OCC) to prevent Race Conditions.
       */
     analyzeWithBackend: async () => {
          const state = get();
          if (state.isCalculating) return;

          // 1. Snapshot the current data version before async request
          // This acts as an OCC token to detect if the user modified the graph during network transit.
          const snapshotDataVersion = state.dataVersion; 

          // --- ABORT CONTROLLER (TIMEOUT 30s) ---
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30_000);

          set({ isCalculating: true, backendWarnings: [] });
          
          try {
            // Adapter Pattern: Strip visual metadata (x/y, colors) and cast strings to Doubles for Java
            const payload = buildTreeAnalysisPayload(state.nodes, state.edges, state.evaluationMode);
            
            // Przekazujemy sygnał (controller.signal) do API, aby móc przerwać żądanie
            const result = await decisionApi.analyzeTree(payload, controller.signal);
            
            // 2. CRITICAL GUARD (Race Condition Prevention)
            // If the user moved a slider while waiting for the response, discard the stale server response.
            if (get().dataVersion !== snapshotDataVersion) {
              console.warn("Discarded server response: Graph was modified by user during network latency.");
              return; 
            }
            
            // Hydrate nodes with strict, server-verified Expected Monetary Values (EMV)
            const updatedNodes = state.nodes.map(node => {
              const backendEval = result.evaluationMap[node.id];
              if (backendEval) {
                return { 
                  ...node, 
                  data: { ...node.data, expectedValue: backendEval.emv, equation: backendEval.equation ?? node.data.equation } 
                };
              }
              return node;
            });
            const hasWarnings = result.warnings && result.warnings.length > 0;

            // --- NOWOŚĆ: Tłumacz (Parser) komunikatów z serwera ---
            // Zamienia np. "węzła losowego 'c3'" na "węzła losowego nr 4"
            const humanFriendlyWarnings = (result.warnings || []).map(warning => {
              // Szukamy czegokolwiek w apostrofach, co pasuje do naszych ID (np. 'c3', 'd1')
              return warning.replace(/'(c\d+|d\d+|t\d+)'/g, (match, nodeId) => {
                const node = updatedNodes.find(n => n.id === nodeId);
                if (node && node.data && node.data.nodeNumber) {
                  return `nr ${node.data.nodeNumber}`; // Zwraca "nr 4" (bez apostrofów)
                }
                return match; // Jeśli z jakiegoś powodu nie znajdzie węzła, zostawia 'c3'
              });
            });
            
            // Single Source of Truth update + trigger background auto-save (isDirty: true)
            set({
              nodes: updatedNodes,
              evaluationMap: result.evaluationMap || {},
              winningPath: result.winningPath || [],
              backendWarnings: humanFriendlyWarnings || [],
              isDirty: true,
            });

            if (!hasWarnings) {
              useToastStore.getState().addToast(
                'Analiza serwera zakończona. Ścieżka optymalna zaktualizowana.',
                'success'
              );
            }

          } catch (error) {
            console.error('Błąd analizy drzewa na backendzie:', error);
            
            
            if (error.name === 'CanceledError' || error.name === 'AbortError') {
              useToastStore.getState().addToast('Analiza przekroczyła limit czasu (30s).', 'error');
            } else {
              useToastStore.getState().addToast('Błąd weryfikacji serwera. Wyniki lokalne pozostają aktywne.', 'error');
            }
          } finally {
              
              clearTimeout(timeoutId); 
              set({ isCalculating: false });
          }
        },
        
      /**
       * Silent Background Auto-Save.
       * Uses guard clauses to prevent overlapping writes or saving readonly history snapshots.
       */
      saveToBackend: async () => {
        const state = get();
        if (!state.currentProjectId || state.isSaving || state.isPreviewMode) return; 

        set({ isSaving: true, saveError: null });
        try {
          await decisionApi.saveTree(state.currentProjectId, {
            nodes: state.nodes,
            edges: state.edges,
            stageColumnLabels: state.stageColumnLabels,
            evaluationMode: state.evaluationMode
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
          const data = await decisionApi.getTreeTemplate(templateId);
          get().loadScenario(
            data.nodes || [], 
            data.edges || [], 
            data.labels || [], 
            { clearProjectId: true, evaluationMode: data.evaluationMode || EVALUATION_MODES.MAX } 
          );
        } catch (error) {
          console.error("Template load error:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      loadCloudProject: async (projectId) => {
        set({ isLoading: true, loadError: null });
        try {
          const project = await decisionApi.getProject(projectId);
          const safeContent = project.content || {}; 
          
          const nodes = safeContent.nodes || [];
          const edges = safeContent.edges || [];
          const stageColumnLabels = safeContent.stageColumnLabels || safeContent.labels || [];
         
          const evaluationMode = safeContent.evaluationMode || EVALUATION_MODES.MAX;

          get().loadScenario(nodes, edges, stageColumnLabels, { evaluationMode });
          set({ currentProjectId: projectId });

        } catch (error) {
          console.error("Cloud project load critical error:", error);
          // UX: Map raw HTTP status codes to user-friendly messages
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

      // --- LOAD & RESET ---
      
      /**
       * Pure function pipeline for graph hydration.
       * Calculates visual layout -> renumbers stages -> syncs labels -> runs local EMV math.
       */
      loadScenario: (newNodes, newEdges, newLabels = [], { clearProjectId = false, evaluationMode = null  } = {}) =>
        set((state) => {
          const layoutedNodes = getLayoutedElements(newNodes, newEdges);
          const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, newEdges);
          const stageColumnLabels = syncColumnLabels(renumbered, newEdges, newLabels);

          const newState = {
            ...state,
            nodes: renumbered,
            edges: newEdges,
            stageColumnLabels,
            evaluationMode: evaluationMode || state.evaluationMode, 
            dataVersion: state.dataVersion + 1, 
            isDirty: false,
            ...(clearProjectId && { currentProjectId: null })
          };
          return evaluateAndSetWinningPath(newState);
        }),

      resetTree: () => set((state) => {
        const newState = { 
          ...state, nodes: [], edges: [], stageColumnLabels: [], isDirty: false, 
          currentProjectId: null, saveError: null, loadError: null, evaluationMode: EVALUATION_MODES.MAX,
          dataVersion: state.dataVersion + 1 
        };    
        return evaluateAndSetWinningPath(newState);
      }),

      // --- USER ACTIONS (GRAPH MANIPULATION) ---
      
      setEvaluationMode: (mode) => set((state) => evaluateAndSetWinningPath({ ...state, evaluationMode: mode, isDirty: true })),

      setStageColumnLabel: (index, text) =>
        set((state) => {
          const next = [...state.stageColumnLabels];
          if (index < 0) return state;
          while (next.length <= index) next.push('');
          next[index] = text;
          return { stageColumnLabels: next, isDirty: true, dataVersion: state.dataVersion + 1 }; 
        }),

      updateEdgeData: (edgeId, patch) =>
        set((state) => {
          const newState = {
            ...state,
            edges: state.edges.map((e) => e.id === edgeId ? { ...e, data: { ...e.data, ...patch } } : e),
            isDirty: true,
            dataVersion: state.dataVersion + 1 
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
            isDirty: true,
            dataVersion: state.dataVersion + 1 
          };
          return evaluateAndSetWinningPath(newState);
        }),

      updateNodeData: (nodeId, patch) =>
        set((state) => {
           const newState = {
            ...state,
            nodes: state.nodes.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n),
            isDirty: true,
            dataVersion: state.dataVersion + 1 
          };
          return evaluateAndSetWinningPath(newState);
        }),

      /**
       * Modifies a branch probability and automatically triggers a sibling rebalance
       * to maintain the 100% mathematical constraint for Chance nodes.
       */
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
          const newState = { ...state, edges: updatedEdges, isDirty: true, dataVersion: state.dataVersion + 1 }; 
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

          const newState = { ...state, edges: allEdges, isDirty: true, dataVersion: state.dataVersion + 1 }; 
          return evaluateAndSetWinningPath(newState);
        }),
        
      toggleSimulationMode: () =>
        set((state) => {
          const newMode = !state.isSimulationMode;
          if (!newMode) return { isSimulationMode: false };

          // Unlock all chance nodes to allow fluid "what-if" slider testing
          const chanceNodeIds = new Set(state.nodes.filter(n => n.type === NODE_TYPES.CHANCE).map(n => n.id));
          let hasChanges = false;
          
          const newEdges = state.edges.map(edge => {
            if (chanceNodeIds.has(edge.source) && edge.data?.isLocked !== false) {
              hasChanges = true;
              return { ...edge, data: { ...edge.data, isLocked: false } };
            }
            return edge;
          });

          if (!hasChanges) return { isSimulationMode: true };

          const newState = { ...state, edges: newEdges, isSimulationMode: true, isDirty: true, dataVersion: state.dataVersion + 1 }; 
          return evaluateAndSetWinningPath(newState);
        }),

      addBranch: (parentId, childKind) =>
        set((state) => {
          const parent = state.nodes.find((n) => n.id === parentId);
          if (!parent || (parent.type !== NODE_TYPES.DECISION && parent.type !== NODE_TYPES.CHANCE)) return state;

          const newNodeId = nextDomId(childKind === NODE_TYPES.CHANCE ? 'c' : 't');
          const existingOutgoing = state.edges.filter((e) => e.source === parentId);
          const isFromChance = parent.type === NODE_TYPES.CHANCE;
          
          let edgeData = isFromChance 
            ? { optionLabel: `Zdarzenie ${existingOutgoing.length + 1}`, probability: '0%', isLocked: false }
            : { optionLabel: `Opcja ${existingOutgoing.length + 1}`, probability: null };

          const newNode = {
            id: newNodeId,
            type: childKind,
            position: { x: 0, y: 0 }, 
            zIndex: 100,
            data: childKind === NODE_TYPES.TERMINAL ? { payoff: '0 zł' } : { nodeNumber: 0 },
          };

          const newEdge = { id: nextDomId('e'), source: parentId, target: newNodeId, type: 'smartChoices', data: edgeData };

          let edgesWithNew = [...state.edges, newEdge];
          if (isFromChance) {
            edgesWithNew = rebalanceProbabilities(edgesWithNew, parentId);
          }

          const nodesWithNew = [...state.nodes, newNode];
          
          // Trigger the layout pipeline for the updated graph
          const layoutedNodes = getLayoutedElements(nodesWithNew, edgesWithNew);
          const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, edgesWithNew);
          const stageColumnLabels = syncColumnLabels(renumbered, edgesWithNew, state.stageColumnLabels);

          const newState = {
            ...state,
            nodes: renumbered,
            edges: edgesWithNew,
            stageColumnLabels,
            isDirty: true,
            dataVersion: state.dataVersion + 1 
          };
          return evaluateAndSetWinningPath(newState);
        }),

       removeNode: (nodeId) =>
        set((state) => {
          const incomingEdge = state.edges.find((e) => e.target === nodeId);
          if (!incomingEdge) return state; 
          
          // DFS Graph Traversal to find all children and prune the entire sub-tree
          const removeSet = collectDescendants(nodeId, state.edges);
          removeSet.add(nodeId); 

          const parentId = incomingEdge.source;
          let remainingEdges = state.edges.filter((e) => !removeSet.has(e.source) && !removeSet.has(e.target));

          const parent = state.nodes.find((n) => n.id === parentId);
          if (parent && parent.type === NODE_TYPES.CHANCE) {
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
            isDirty: true,
            dataVersion: state.dataVersion + 1 
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

          if (newType === NODE_TYPES.TERMINAL) {
            const removeSet = collectDescendants(nodeId, state.edges);
            removeSet.delete(nodeId); 
            remainingNodes = remainingNodes.filter((n) => !removeSet.has(n.id));
            remainingEdges = remainingEdges.filter((e) => !removeSet.has(e.source) && !removeSet.has(e.target) && e.source !== nodeId);
          }

          const targetIndex = remainingNodes.findIndex((n) => n.id === nodeId);
          if (targetIndex === -1) return state; 
          
          const oldData = remainingNodes[targetIndex].data;
          let newData = { ...oldData };
          if (newType === NODE_TYPES.TERMINAL) {
            newData = { payoff: oldData.payoff || '0 zł' };
            delete newData.nodeNumber;
          } else {
            newData = { nodeNumber: oldData.nodeNumber || 0 };
            delete newData.payoff;
          }

          remainingNodes[targetIndex] = { ...remainingNodes[targetIndex], type: newType, data: newData };

          if (newType !== NODE_TYPES.TERMINAL) {
            remainingEdges = remainingEdges.map((e) => {
              if (e.source === nodeId) {
                if (newType === NODE_TYPES.DECISION) return { ...e, data: { ...e.data, probability: null, isLocked: false } };
                if (newType === NODE_TYPES.CHANCE) return { ...e, data: { ...e.data, probability: '0%', isLocked: false } };
              }
              return e;
            });
            
            if (newType === NODE_TYPES.CHANCE) {
              remainingEdges = rebalanceProbabilities(remainingEdges, nodeId);
            }
          }

          const layoutedNodes = getLayoutedElements(remainingNodes, remainingEdges);
          const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, remainingEdges);
          const stageColumnLabels = syncColumnLabels(renumbered, remainingEdges, state.stageColumnLabels);

          const newState = { ...state, nodes: renumbered, edges: remainingEdges, stageColumnLabels, isDirty: true, dataVersion: state.dataVersion + 1 }; 
          return evaluateAndSetWinningPath(newState);
        }),

      importJson: (jsonString) =>
        set((state) => {
          try {
            const parsed = JSON.parse(jsonString);
            if (parsed.nodes && parsed.edges) {
              const layoutedNodes = getLayoutedElements(parsed.nodes, parsed.edges);
              const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, parsed.edges);
              const labelsToLoad = parsed.stageColumnLabels || parsed.labels || [];
              const stageColumnLabels = syncColumnLabels(renumbered, parsed.edges, labelsToLoad || []);

              const newState = {
                ...state,
                nodes: renumbered,
                edges: parsed.edges,
                stageColumnLabels,
                evaluationMode: parsed.evaluationMode || EVALUATION_MODES.MAX,
                isDirty: false,
                dataVersion: state.dataVersion + 1 
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

          if (parent.type === NODE_TYPES.CHANCE) {
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
            isDirty: true,
            dataVersion: state.dataVersion + 1 
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
        winningPath: state.winningPath, 
      }),
      /**
       * Performance Guard: Shallow equality check for Zundo (Undo/Redo history).
       * Prevents memory bloat by only saving new snapshots when specific state domains change,
       * ignoring ephemeral UI state like 'isCalculating' or 'isLoading'.
       */
      equality: (pastState, currentState) => {
        return pastState.nodes === currentState.nodes &&
               pastState.edges === currentState.edges &&
               pastState.stageColumnLabels === currentState.stageColumnLabels &&
               pastState.evaluationMode === currentState.evaluationMode;
      },
    }
   ),
   {
     name: 'tree-storage',
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