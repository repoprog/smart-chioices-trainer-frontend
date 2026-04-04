import { create, useStore } from 'zustand';
import { temporal } from 'zundo';
import dagre from 'dagre';
import {
  collectDescendants,
  computeDepthMap,
  getTreeMaxDepth,
  nextDomId,
  renumberDecisionAndChanceNodes,
  findMainPathNodes 
} from './treeUtils.js';
import { evaluateDecisionTree } from '../logic/evaluation.js';

function syncColumnLabels(nodes, edges, prevLabels = []) {
  const mainPathNodes = findMainPathNodes(nodes, edges);
  const columnCount = mainPathNodes.length;
  
  if (columnCount === 0) return []; 

  let result = [...prevLabels];

  while (result.length < columnCount) {
     result.push(''); 
  }
 
  if (result.length > columnCount) {
    result = result.slice(0, columnCount);
  }

  return result;
}

export function getLayoutedElements(nodes, edges) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 260, nodesep: 60 });

  const depthMap = computeDepthMap(nodes, edges);
  const maxDepth = getTreeMaxDepth(depthMap);

  const nodesForDagre = [...nodes];
  const edgesForDagre = [];

  edges.forEach((edge) => {
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (targetNode?.type === 'terminal') {
      const sourceNodeId = edge.source;
      const targetNodeId = edge.target;

      const sourceNodeDepth = depthMap.get(sourceNodeId) ?? 0;
      const terminalNodeDepth = sourceNodeDepth + 1;

      const depthDiff = maxDepth - terminalNodeDepth;

      if (depthDiff > 0) {
        let lastNodeIdInChain = sourceNodeId;
        for (let i = 0; i < depthDiff; i++) {
          const dummyId = `dummy|${edge.id}|${i}`;
          nodesForDagre.push({ id: dummyId });

          edgesForDagre.push({
            source: lastNodeIdInChain,
            target: dummyId,
            id: `e-dummy|${lastNodeIdInChain}|${dummyId}`,
            type: 'smartChoices',
            data: {},
          });
          lastNodeIdInChain = dummyId;
        }
        edgesForDagre.push({
          source: lastNodeIdInChain,
          target: targetNodeId,
          id: `e-dummy|${lastNodeIdInChain}|${targetNodeId}`,
          type: 'smartChoices',
          data: {},
        });
      } else {
        edgesForDagre.push(edge);
      }
    } else {
      edgesForDagre.push(edge);
    }
  });

  nodesForDagre.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 44, height: 44 });
  });

  edgesForDagre.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  let maxLeftX = 0;
  let minY = Infinity;
  nodes.forEach((node) => {
    const pos = dagreGraph.node(node.id);
    if (!pos) {
      return;
    }
    const leftX = pos.x - 22;
    if (leftX > maxLeftX) {
      maxLeftX = leftX;
    }
    const topY = pos.y - 22;
    if (topY < minY) {
      minY = topY;
    }
  });

  const yOffset = -minY + 20;

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    let finalX = nodeWithPosition.x - 22;
    const finalY = nodeWithPosition.y - 22 + yOffset;

    if (node.type === 'terminal') {
      finalX = maxLeftX;
    }

    return {
      ...node,
      position: { x: finalX, y: finalY },
    };
  });
}

const initialNodes = [
  {
    id: 'd1',
    type: 'decision',
    position: { x: 32, y: 220 },
    zIndex: 100,
    data: { nodeNumber: 1 },
  },
  {
    id: 'c1',
    type: 'chance',
    position: { x: 300, y: 140 },
    data: { nodeNumber: 2 },
  },
  {
    id: 't-no',
    type: 'terminal',
    position: { x: 300, y: 400 },
    data: { payoff: '0 zł' },
  },
  {
    id: 't-up',
    type: 'terminal',
    position: { x: 620, y: 60 },
    data: { payoff: '120 000 zł' },
  },
  {
    id: 't-down',
    type: 'terminal',
    position: { x: 620, y: 220 },
    data: { payoff: '−40 000 zł' },
  },
];

const initialEdges = [
  {
    id: 'e-d1-c1',
    source: 'd1',
    target: 'c1',
    type: 'smartChoices',
    data: { optionLabel: 'Tak', probability: null },
  },
  {
    id: 'e-d1-tno',
    source: 'd1',
    target: 't-no',
    type: 'smartChoices',
    data: { optionLabel: 'Nie', probability: null },
  },
  {
    id: 'e-c1-tup',
    source: 'c1',
    target: 't-up',
    type: 'smartChoices',
    data: { optionLabel: 'Sukces', probability: '60.00%', isLocked: false },
  },
  {
    id: 'e-c1-tdown',
    source: 'c1',
    target: 't-down',
    type: 'smartChoices',
    data: { optionLabel: 'Porażka', probability: '40.00%', isLocked: false },
  },
];

const numberedInitial = renumberDecisionAndChanceNodes(
  initialNodes,
  initialEdges,
);

const initialStageLabels = syncColumnLabels(
  numberedInitial,
  initialEdges,
  [],
);

const parseProbability = (p) => {
  if (p == null) return 0;
  return parseFloat(String(p).replace('%', '')) || 0;
};

const formatProbability = (p) => `${p.toFixed(2)}%`;

function rebalanceProbabilities(edges, sourceId) {
    const childEdges = edges.filter(e => e.source === sourceId);
    if (childEdges.length === 0) return edges;

    const lockedEdges = childEdges.filter(e => e.data.isLocked);
    const unlockedEdges = childEdges.filter(e => !e.data.isLocked);

    const lockedTotal = lockedEdges.reduce((sum, e) => sum + parseProbability(e.data.probability), 0);
    
    const remainder = Math.max(0, 100 - lockedTotal);

    let updatedEdges = [...edges];

    if (unlockedEdges.length > 0) {
        const evenSplit = remainder / unlockedEdges.length;
        let distributedRemainder = 0;

        unlockedEdges.forEach((edge, idx) => {
            let newProb;
            if (idx < unlockedEdges.length - 1) {
                newProb = parseFloat(evenSplit.toFixed(2));
                distributedRemainder += newProb;
            } else {
                newProb = parseFloat((remainder - distributedRemainder).toFixed(2));
            }

            const edgeIndex = updatedEdges.findIndex(e => e.id === edge.id);
            if (edgeIndex !== -1) {
                updatedEdges[edgeIndex] = {
                    ...updatedEdges[edgeIndex],
                    data: {
                        ...updatedEdges[edgeIndex].data,
                        probability: formatProbability(newProb),
                    },
                };
            }
        });
    }

    return updatedEdges;
}

// --- ALGORYTM PRAWDOPODOBIEŃSTWA ---
function calculatePathProbabilities(nodes, edges) {
  const probMap = {};
  const rootNodes = nodes.filter(n => !edges.some(e => e.target === n.id));
  const queue = rootNodes.map(r => ({ id: r.id, currentProb: 1.0 }));

  while(queue.length > 0) {
    const { id, currentProb } = queue.shift();
    probMap[id] = currentProb;

    const node = nodes.find(n => n.id === id);
    const outgoingEdges = edges.filter(e => e.source === id);

    outgoingEdges.forEach(edge => {
      let nextProb = currentProb;
      if (node?.type === 'chance') {
        const edgeP = parseProbability(edge.data?.probability) / 100;
        nextProb = currentProb * edgeP;
      }
      queue.push({ id: edge.target, currentProb: nextProb });
    });
  }
  return probMap;
}

// --- GŁÓWNA FUNKCJA EWALUACJI ---
const evaluateAndSetWinningPath = (state) => {
  const { nodes, edges, evaluationMode } = state;
  const evaluationMap = evaluateDecisionTree(nodes, edges, evaluationMode);
  
  const cumulativeProbs = calculatePathProbabilities(nodes, edges);

  const nodesWithEv = nodes.map(node => {
    const evaluationResult = evaluationMap[node.id];
    const newData = { ...node.data };
    
    delete newData.expectedValue;
    
    if (evaluationResult && typeof evaluationResult.ev === 'number' && !isNaN(evaluationResult.ev)) {
      newData.expectedValue = evaluationResult.ev;
      newData.equation = evaluationResult.equation;
    }
    
    newData.pathProbability = cumulativeProbs[node.id] ?? 0;

    return { ...node, data: newData };
  });
  
  const winningPath = new Set();

  //  Sprawdzamy, czy w jakimkolwiek węźle Szansy jest błąd sumy % ---
  let hasProbabilityError = false;
  for (const node of nodes) {
    if (node.type === 'chance') {
      const outgoingEdges = edges.filter((e) => e.source === node.id);
      if (outgoingEdges.length > 0) {
        const sum = outgoingEdges.reduce((acc, e) => acc + parseProbability(e.data?.probability), 0);
        
        if (Math.abs(sum - 100) > 0.01) {
          hasProbabilityError = true;
          break; 
        }
      }
    }
  }
  
  // Budujemy zwycięską ścieżkę TYLKO wtedy, gdy nie ma błędów w prawdopodobieństwach
  if (!hasProbabilityError) {
    const rootNode = nodesWithEv.find(
      (n) => (n.type === 'decision' || n.type === 'chance') && !edges.some((e) => e.target === n.id)
    );

    if (rootNode) {
      const queue = [rootNode.id];
      winningPath.add(rootNode.id);

      while (queue.length > 0) {
        const currentNodeId = queue.shift();
        const currentNode = nodesWithEv.find((n) => n.id === currentNodeId);
        const evaluationResult = evaluationMap[currentNodeId];

        if (currentNode?.type === 'decision' && evaluationResult?.optimalEdgeId) {
          const optimalEdge = edges.find((e) => e.id === evaluationResult.optimalEdgeId);
          if (optimalEdge) {
            winningPath.add(optimalEdge.id);
            winningPath.add(optimalEdge.target);
            queue.push(optimalEdge.target);
          }
        } else {
          const childEdges = edges.filter((e) => e.source === currentNodeId);
          childEdges.forEach((edge) => {
            if(currentNode?.type === 'chance') {
               winningPath.add(edge.id);
               winningPath.add(edge.target);
               queue.push(edge.target);
            }
          });
        }
      }
    }
  }

  return { ...state, nodes: nodesWithEv, evaluationMap, winningPath };
};

// --- STORE ---
export const useTreeStore = create()(
  temporal((set) => ({
  nodes: numberedInitial,
  edges: initialEdges,
  stageColumnLabels: initialStageLabels,
  evaluationMode: 'max',
  evaluationMap: {},
  winningPath: new Set(),

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
      };
      
      return evaluateAndSetWinningPath(newState);
    }),

  setEvaluationMode: (mode) => set((state) => evaluateAndSetWinningPath({ ...state, evaluationMode: mode })),

  setStageColumnLabel: (index, text) =>
    set((state) => {
      const next = [...state.stageColumnLabels];
      if (index < 0) return state;
      while (next.length <= index) next.push('');
      next[index] = text;
      return { stageColumnLabels: next };
    }),

  updateEdgeData: (edgeId, patch) =>
    set((state) => {
      const newState = {
        ...state,
        edges: state.edges.map((e) =>
          e.id === edgeId ? { ...e, data: { ...e.data, ...patch } } : e
        ),
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
          e.source === sourceNodeId
            ? { ...e, data: { ...e.data, showCost: willShow, localShowCost: false } }
            : e
        ),
      };
      return evaluateAndSetWinningPath(newState);
    }),

  updateNodeData: (nodeId, patch) =>
    set((state) => {
       const newState = {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
        ),
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
        data: {
          ...editedEdge.data,
          probability: formatProbability(newProb),
          isLocked: true,
        },
      };
      
      const updatedEdges = rebalanceProbabilities(allEdges, sourceNodeId);

      const newState = { ...state, edges: updatedEdges };
      return evaluateAndSetWinningPath(newState);
    }),

    toggleEdgeAutoBalance: (edgeId) =>
    set((state) => {
      let allEdges = [...state.edges];
      const edgeIndex = allEdges.findIndex((e) => e.id === edgeId);
      if (edgeIndex === -1) return state;

      const edge = allEdges[edgeIndex];
      const isCurrentlyLocked = edge.data?.isLocked;

      // Przełączamy stan isLocked na odwrotny
      allEdges[edgeIndex] = {
        ...edge,
        data: {
          ...edge.data,
          isLocked: !isCurrentlyLocked,
        },
      };

    
      if (isCurrentlyLocked) {
        allEdges = rebalanceProbabilities(allEdges, edge.source);
      }

      const newState = { ...state, edges: allEdges };
      return evaluateAndSetWinningPath(newState);
    }),

  addBranch: (parentId, childKind) =>
    set((state) => {
      const parent = state.nodes.find((n) => n.id === parentId);
      if (
        !parent ||
        (parent.type !== 'decision' && parent.type !== 'chance')
      ) {
        return state;
      }

      const newNodeId = nextDomId(childKind === 'chance' ? 'c' : 't');
      
      const existingOutgoing = state.edges.filter(
        (e) => e.source === parentId
      );

      const isFromChance = parent.type === 'chance';
      let edgeData;

      if (isFromChance) {
        edgeData = {
          optionLabel: `Zdarzenie ${existingOutgoing.length + 1}`,
          probability: '0%',
          isLocked: false,
        };
      } else {
        edgeData = {
          optionLabel: `Opcja ${existingOutgoing.length + 1}`,
          probability: null,
        };
      }

      const newNode = {
        id: newNodeId,
        type: childKind,
        position: { x: 0, y: 0 }, 
        zIndex: 100,
        data: childKind === 'chance' ? { nodeNumber: 0 } : { payoff: '0 zł' },
      };

      const newEdge = {
        id: nextDomId('e'),
        source: parentId,
        target: newNodeId,
        type: 'smartChoices',
        data: edgeData,
      };

      let edgesWithNew = [...state.edges, newEdge];
      if (isFromChance) {
        edgesWithNew = rebalanceProbabilities(edgesWithNew, parentId);
      }

      const nodesWithNew = [...state.nodes, newNode];
      
      const layoutedNodes = getLayoutedElements(nodesWithNew, edgesWithNew);

      const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, edgesWithNew);
      const stageColumnLabels = syncColumnLabels(
        renumbered,
        edgesWithNew,
        state.stageColumnLabels
      );

      const newState = {
        ...state,
        nodes: renumbered,
        edges: edgesWithNew,
        stageColumnLabels,
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

      let remainingEdges = state.edges.filter(
        (e) => !removeSet.has(e.source) && !removeSet.has(e.target)
      );

      const parent = state.nodes.find((n) => n.id === parentId);
      if (parent && parent.type === 'chance') {
        remainingEdges = rebalanceProbabilities(remainingEdges, parentId);
      }
      
      const remainingNodes = state.nodes.filter((n) => !removeSet.has(n.id));

      const layoutedNodes = getLayoutedElements(remainingNodes, remainingEdges);

      const renumbered = renumberDecisionAndChanceNodes(
        layoutedNodes,
        remainingEdges
      );
      const stageColumnLabels = syncColumnLabels(
        renumbered,
        remainingEdges,
        state.stageColumnLabels
      );
      
      const newState = {
        ...state,
        nodes: renumbered,
        edges: remainingEdges,
        stageColumnLabels,
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
        remainingEdges = remainingEdges.filter(
          (e) => !removeSet.has(e.source) && !removeSet.has(e.target) && e.source !== nodeId
        );
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

      remainingNodes[targetIndex] = {
        ...remainingNodes[targetIndex],
        type: newType,
        data: newData,
      };

      if (newType !== 'terminal') {
        remainingEdges = remainingEdges.map((e) => {
          if (e.source === nodeId) {
            if (newType === 'decision') {
              return { ...e, data: { ...e.data, probability: null, isLocked: false } };
            }
            if (newType === 'chance') {
              return { ...e, data: { ...e.data, probability: '0%', isLocked: false } };
            }
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

      const newState = { ...state, nodes: renumbered, edges: remainingEdges, stageColumnLabels };
      return evaluateAndSetWinningPath(newState);
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

      let remainingEdges = state.edges.filter(
        (e) =>
          e.id !== victimEdge.id &&
          !removeSet.has(e.source) &&
          !removeSet.has(e.target)
      );

      const isFromChance = parent.type === 'chance';
      if (isFromChance) {
        remainingEdges = rebalanceProbabilities(remainingEdges, parentId);
      }
      
      const remainingNodes = state.nodes.filter((n) => !removeSet.has(n.id));
      
      const layoutedNodes = getLayoutedElements(remainingNodes, remainingEdges);

      const renumbered = renumberDecisionAndChanceNodes(
        layoutedNodes,
        remainingEdges
      );
      const stageColumnLabels = syncColumnLabels(
        renumbered,
        remainingEdges,
        state.stageColumnLabels
      );
      
      const newState = {
        ...state,
        nodes: renumbered,
        edges: remainingEdges,
        stageColumnLabels,
      };
      return evaluateAndSetWinningPath(newState);
    }),
    
    init: () => set(state => evaluateAndSetWinningPath(state)),
}),
{
     limit: 50, 
      partialize: (state) => ({
        // WYMAGANE: Eksplicytnie zwracamy TYLKO twarde dane.
        // Dzięki temu zundo nie nadpisuje funkcji (np. loadScenario) wartością undefined podczas cofania.
        nodes: state.nodes,
        edges: state.edges,
        stageColumnLabels: state.stageColumnLabels,
        evaluationMode: state.evaluationMode,
        evaluationMap: state.evaluationMap,
        winningPath: state.winningPath,
      }),
    }
  )
);

export const useTemporalTreeStore = (selector) => useStore(useTreeStore.temporal, selector);

useTreeStore.getState().init();
useTreeStore.temporal.getState().clear();

