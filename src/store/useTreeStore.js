import { create } from 'zustand';
import dagre from 'dagre';
import {
  collectDescendants,
  computeDepthMap,
  ensureColumnLabelsLength,
  getTreeMaxDepth,
  nextDomId,
  renumberDecisionAndChanceNodes,
} from './treeUtils.js';

function syncColumnLabels(nodes, edges, prevLabels) {
  const dm = computeDepthMap(nodes, edges);
  const maxD = getTreeMaxDepth(dm);
  const len = Math.max(0, maxD);
  return ensureColumnLabelsLength(prevLabels, len);
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
            type: 'smartChoices', // Make it a known type
            data: {}, // Add clean data object
          });
          lastNodeIdInChain = dummyId;
        }
        edgesForDagre.push({
          source: lastNodeIdInChain,
          target: targetNodeId,
          id: `e-dummy|${lastNodeIdInChain}|${targetNodeId}`,
          type: 'smartChoices', // Make it a known type
          data: {}, // Add clean data object
        });
      } else {
        edgesForDagre.push(edge);
      }
    } else {
      edgesForDagre.push(edge);
    }
  });

  // 1. Define dimensions for all nodes, including dummy ones
  nodesForDagre.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 44, height: 44 });
  });

  edgesForDagre.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // 2. Find the "finish line" for terminal nodes and normalize Y positions
  let maxLeftX = 0;
  let minY = Infinity;
  nodes.forEach((node) => {
    // Only iterate over original nodes to calculate bounds
    const pos = dagreGraph.node(node.id);
    if (!pos) {
      return;
    }
    const leftX = pos.x - 22; // 44 / 2 = 22
    if (leftX > maxLeftX) {
      maxLeftX = leftX;
    }
    const topY = pos.y - 22;
    if (topY < minY) {
      minY = topY;
    }
  });

  const yOffset = -minY + 20; // 20px padding from the top

  // 3. Assign final positions
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    let finalX = nodeWithPosition.x - 22;
    const finalY = nodeWithPosition.y - 22 + yOffset;

    // Align terminals to the right edge
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
    
    // ZMIANA TUTAJ: Pozwalamy lockedTotal przekroczyć 100. 
    // Jeśli zablokowane wynoszą > 100, dla reszty (unlocked) zostaje po prostu 0.
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

export const useTreeStore = create((set) => ({
  nodes: numberedInitial,
  edges: initialEdges,
  stageColumnLabels: initialStageLabels,

  setStageColumnLabel: (index, text) =>
    set((state) => {
      const next = [...state.stageColumnLabels];
      if (index < 0) return state;
      while (next.length <= index) next.push('');
      next[index] = text;
      return { stageColumnLabels: next };
    }),

  updateEdgeData: (edgeId, patch) =>
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...patch } } : e
      ),
    })),

    updateNodeData: (nodeId, patch) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
      ),
    })),

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

      return { edges: updatedEdges };
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

      // ...góra funkcji addBranch bez zmian...

      // Nowy węzeł - pozycja nie ma znaczenia, dagre ją ustawi!
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

      // 1. Łączymy stare węzły z nowym
      const nodesWithNew = [...state.nodes, newNode];
      
      // 2. MAGIA: Przepuszczamy całość przez algorytm, który sam je rozsunie symetrycznie!
      const layoutedNodes = getLayoutedElements(nodesWithNew, edgesWithNew);

      const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, edgesWithNew);
      const stageColumnLabels = syncColumnLabels(
        renumbered,
        edgesWithNew,
        state.stageColumnLabels
      );

      return {
        nodes: renumbered,
        edges: edgesWithNew,
        stageColumnLabels,
      };
    }),
   removeNode: (nodeId) =>
    set((state) => {
      // 1. Zabezpieczenie: nie pozwalamy usunąć korzenia (węzła startowego), bo zniknęłoby całe drzewo!
      const incomingEdge = state.edges.find((e) => e.target === nodeId);
      if (!incomingEdge) return state; 

      // 2. Zbieramy węzeł i wszystkie jego "dzieci", "wnuki" itd. do usunięcia
      const removeSet = collectDescendants(nodeId, state.edges);
      removeSet.add(nodeId); // Dodajemy do listy usunięć samego siebie

      const parentId = incomingEdge.source;

      // 3. Usuwamy krawędzie powiązane z usuwanymi węzłami
      let remainingEdges = state.edges.filter(
        (e) => !removeSet.has(e.source) && !removeSet.has(e.target)
      );

      // 4. Jeśli rodzic był węzłem losowym (Chance), rebalansujemy jemu procenty!
      const parent = state.nodes.find((n) => n.id === parentId);
      if (parent && parent.type === 'chance') {
        remainingEdges = rebalanceProbabilities(remainingEdges, parentId);
      }
      
      // 5. Usuwamy fizycznie węzły
      const remainingNodes = state.nodes.filter((n) => !removeSet.has(n.id));

      // 6. Przepuszczamy przez algorytm Dagre, żeby domknął dziurę
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
      
      return {
        nodes: renumbered,
        edges: remainingEdges,
        stageColumnLabels,
      };
    }),
 swapNodeType: (nodeId, newType) =>
    set((state) => {
      const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
      if (nodeIndex === -1) return state;

      const node = state.nodes[nodeIndex];
      if (node.type === newType) return state;

      let remainingNodes = [...state.nodes];
      let remainingEdges = [...state.edges];

      // 1. CIĘCIE: Jeśli zamieniamy w Konsekwencję, ucinamy wszystko pod spodem!
      if (newType === 'terminal') {
        const removeSet = collectDescendants(nodeId, state.edges);
        
        // KLUCZOWA POPRAWKA: Wyjmujemy nasz główny węzeł z listy do usunięcia, żeby przetrwał czystkę!
        removeSet.delete(nodeId); 
        
        remainingNodes = remainingNodes.filter((n) => !removeSet.has(n.id));
        remainingEdges = remainingEdges.filter(
          (e) => !removeSet.has(e.source) && !removeSet.has(e.target) && e.source !== nodeId
        );
      }

      // 2. AKTUALIZACJA WĘZŁA
      const targetIndex = remainingNodes.findIndex((n) => n.id === nodeId);
      
      // Dodatkowy bezpiecznik - gdyby coś poszło nie tak, przerywamy zamiast wywalać aplikację
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

      // 3. AKTUALIZACJA KRAWĘDZI
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

      // 4. UKŁADANIE I PRZENUMEROWANIE
      const layoutedNodes = getLayoutedElements(remainingNodes, remainingEdges);
      const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, remainingEdges);
      const stageColumnLabels = syncColumnLabels(renumbered, remainingEdges, state.stageColumnLabels);

      return { nodes: renumbered, edges: remainingEdges, stageColumnLabels };
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

     // ...górna część removeBranch zostaje bez zmian...
      const isFromChance = parent.type === 'chance';
      if (isFromChance) {
        remainingEdges = rebalanceProbabilities(remainingEdges, parentId);
      }
      
      const remainingNodes = state.nodes.filter((n) => !removeSet.has(n.id));
      
      // === MAGIA DAGRE DLA USUWANIA ===
      // Usuwamy całą starą matematykę z parentX, stackY i ręcznym sortowaniem!
      const layoutedNodes = getLayoutedElements(remainingNodes, remainingEdges);
      // =================================

      const renumbered = renumberDecisionAndChanceNodes(
        layoutedNodes,
        remainingEdges
      );
      const stageColumnLabels = syncColumnLabels(
        renumbered,
        remainingEdges,
        state.stageColumnLabels
      );
      
      return {
        nodes: renumbered,
        edges: remainingEdges,
        stageColumnLabels,
      };
    }),
}));
