import dagre from 'dagre';

/**
 * CORE MECHANIC: Counter for generating unique DOM-safe IDs for new nodes and edges.
 */
let idCounter = 0;
export function nextDomId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * CORE MECHANIC: Breadth-first search to collect all descendant nodes and edges.
 * Used for recursive branch removal.
 */
export function collectDescendants(startId, edges) {
  const set = new Set();
  const q = [startId];
  while (q.length) {
    const id = q.shift();
    if (set.has(id)) continue;
    set.add(id);
    for (const e of edges) {
      if (e.source === id) q.push(e.target);
    }
  }
  return set;
}

/**
 * CORE MECHANIC: Calculate node depth relative to the root (0 = root).
 */
export function computeDepthMap(nodes, edges) {
  const hasIncoming = new Set();
  for (const e of edges) hasIncoming.add(e.target);

  const roots = nodes.filter((n) => !hasIncoming.has(n.id));
  if (!roots.length) return new Map();

  const root = roots[0];
  const depth = new Map([[root.id, 0]]);
  const queue = [root.id];
  const outgoing = new Map();
  for (const e of edges) {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source).push(e.target);
  }

  while (queue.length) {
    const id = queue.shift();
    const d = depth.get(id) ?? 0;
    for (const t of outgoing.get(id) ?? []) {
      if (!depth.has(t)) {
        depth.set(t, d + 1);
        queue.push(t);
      }
    }
  }

  return depth;
}

export function getTreeMaxDepth(depthMap) {
  let m = 0;
  for (const d of depthMap.values()) m = Math.max(m, d);
  return m;
}

/**
 * CORE MECHANIC: Assign sequential numbers to Decision and Chance nodes based on BFS order.
 * Ensures consistent UI labels (Decision 1, Chance 2, etc.).
 */
export function renumberDecisionAndChanceNodes(nodes, edges) {
  const hasIncoming = new Set();
  for (const e of edges) hasIncoming.add(e.target);

  const roots = nodes.filter((n) => !hasIncoming.has(n.id));
  const root = roots[0];
  if (!root) return nodes;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = new Map();
  for (const e of edges) {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source).push(e);
  }

  // Sort children by Y position to maintain visual numbering order
  for (const [, list] of outgoing) {
    list.sort((a, b) => {
      const na = byId.get(a.target);
      const nb = byId.get(b.target);
      const dy = (na?.position?.y ?? 0) - (nb?.position?.y ?? 0);
      if (dy !== 0) return dy;
      const dx = (na?.position?.x ?? 0) - (nb?.position?.x ?? 0);
      return dx;
    });
  }

  const orderedIds = [];
  const visited = new Set();
  const queue = [root.id];

  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const node = byId.get(id);
    if (!node) continue;
    if (node.type === 'decision' || node.type === 'chance') {
      orderedIds.push(id);
    }
    for (const e of outgoing.get(id) ?? []) queue.push(e.target);
  }

  let n = 1;
  const idToNumber = new Map();
  for (const id of orderedIds) idToNumber.set(id, n++);

  return nodes.map((node) => {
    if (node.type !== 'decision' && node.type !== 'chance') return node;
    const num = idToNumber.get(node.id) ?? 0;
    return {
      ...node,
      data: { ...node.data, nodeNumber: num },
    };
  });
}

/**
 * CORE MECHANIC: Automated graph layout using Dagre.
 * Aligns terminal nodes to the far right for a clean horizontal finish.
 */
export function getLayoutedElements(nodes, edges) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 260, nodesep: 60 });

  const depthMap = computeDepthMap(nodes, edges);
  const maxDepth = getTreeMaxDepth(depthMap);

  const nodesForDagre = [...nodes];
  const edgesForDagre = [];

  // Logic to handle terminal node alignment across different depths
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
    if (!pos) return;
    const leftX = pos.x - 22;
    if (leftX > maxLeftX) maxLeftX = leftX;
    const topY = pos.y - 22;
    if (topY < minY) minY = topY;
  });

  const yOffset = -minY + 160;

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (!nodeWithPosition) return node;

    let finalX = nodeWithPosition.x - 22;
    const finalY = nodeWithPosition.y - 22 + yOffset;

    // Terminal nodes are pushed to the max calculated X coordinate
    if (node.type === 'terminal') finalX = maxLeftX;

    return { ...node, position: { x: finalX, y: finalY } };
  });
}

/**
 * CORE MECHANIC: Calculate X coordinates for stage columns.
 * Each depth level corresponds to one column header.
 */
export function getUniqueColumnXs(nodes, edges) {
  if (!nodes || nodes.length === 0) return [];
  const depthMap = computeDepthMap(nodes, edges);
  const nodesByDepth = new Map();

  nodes.forEach(node => {
    const depth = depthMap.get(node.id) ?? 0;
    if (!nodesByDepth.has(depth)) nodesByDepth.set(depth, []);
    nodesByDepth.get(depth).push(node.position.x);
  });

  const sortedDepths = Array.from(nodesByDepth.keys()).sort((a, b) => a - b);
  return sortedDepths.map(depth => {
    const xs = nodesByDepth.get(depth);
    return Math.min(...xs);
  });
}

/**
 * CORE MECHANIC: Sync stage column labels with the current number of unique columns.
 */
export function syncColumnLabels(nodes, edges, prevLabels = []) {
  const columnCount = getUniqueColumnXs(nodes, edges).length;
  if (columnCount === 0) return []; 

  let result = [...prevLabels];
  while (result.length < columnCount) result.push('');
  if (result.length > columnCount) result = result.slice(0, columnCount);
  return result;
}

/**
 * CORE MECHANIC: Position the Stage headers above the highest node in the tree.
 */
const STAGE_HEADER_INPUT_HEIGHT = 38;
const STAGE_HEADER_BASE_GAP = 68;

export function computeStageHeaderRowY(nodes) {
  if (!nodes.length) return -STAGE_HEADER_INPUT_HEIGHT - STAGE_HEADER_BASE_GAP;
  let minTop = Infinity;
  for (const n of nodes) minTop = Math.min(minTop, n.position.y);
  
  return minTop - STAGE_HEADER_INPUT_HEIGHT - STAGE_HEADER_BASE_GAP;
}