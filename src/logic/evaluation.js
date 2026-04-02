
const parseValue = (value) => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  // Handles "120 000 zł", "-40 000", "50%", etc.
  const numberString = value
    .replace(/zł/g, '')
    .replace(/%/g, '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace('−', '-'); // Handle different minus characters

  const parsed = parseFloat(numberString);
  return isNaN(parsed) ? 0 : parsed;
};

const parseProbability = (prob, allSiblings, thisEdge) => {
  if (prob != null) {
    return parseValue(prob) / 100;
  }
  // If probability is missing, assume equal distribution among siblings with missing probs
  const unassignedSiblings = allSiblings.filter(
    (edge) => edge.data?.probability == null
  );
  return 1 / (unassignedSiblings.length || 1);
};


/**
 * Evaluates a decision tree from React Flow nodes and edges.
 *
 * @param {Array<object>} nodes - The nodes of the graph.
 * @param {Array<object>} edges - The edges of the graph.
 * @param {'max' | 'min'} optimizationMode - The optimization goal for the tree.
 * @returns {object} - An object with node IDs as keys and their calculated { ev, optimalEdgeId } as values.
 */
export function evaluateDecisionTree(nodes, edges, optimizationMode = 'max') {
  if (!nodes || nodes.length === 0) return {};

  const outgoingEdges = new Map();
  for (const edge of edges) {
    if (!outgoingEdges.has(edge.source)) {
      outgoingEdges.set(edge.source, []);
    }
    outgoingEdges.get(edge.source).push(edge);
  }

  const nodesMap = new Map(nodes.map((node) => [node.id, node]));
  const memo = new Map();

  const calculateEvForNode = (nodeId) => {
    if (memo.has(nodeId)) {
      return memo.get(nodeId);
    }

    const node = nodesMap.get(nodeId);
    if (!node) {
      // This can happen with dummy nodes, treat as a leaf with 0 value.
      return { ev: 0 };
    }

    const childrenEdges = outgoingEdges.get(nodeId) || [];

    let result;
    // Base case: leaf node (terminal or a node with no children)
    if (
      node.type === 'terminal' ||
      childrenEdges.length === 0
    ) {
      const payoff = parseValue(node.data?.payoff);
      result = { ev: payoff };
    } else if (node.type === 'chance') {
      const totalEv = childrenEdges.reduce((sum, edge) => {
        const edgeCost = parseValue(edge.data?.cost);
        const probability = parseProbability(
          edge.data?.probability,
          childrenEdges,
          edge
        );
        const childResult = calculateEvForNode(edge.target);
        return sum + (childResult.ev + edgeCost) * probability;
      }, 0);
      result = { ev: totalEv };
    } else if (node.type === 'decision') {
      const childValues = childrenEdges.map((edge) => {
        const edgeCost = parseValue(edge.data?.cost);
        const childResult = calculateEvForNode(edge.target);
        return {
          ev: childResult.ev + edgeCost,
          edgeId: edge.id,
        };
      });

      if (childValues.length === 0) {
        result = { ev: 0 };
      } else if (optimizationMode === 'max') {
        result = childValues.reduce(
          (max, current) => (current.ev > max.ev ? current : max),
          { ev: -Infinity, edgeId: null }
        );
      } else {
        // 'min' mode
        result = childValues.reduce(
          (min, current) => (current.ev < min.ev ? current : min),
          { ev: Infinity, edgeId: null }
        );
      }
      result = { ev: result.ev, optimalEdgeId: result.edgeId };
    } else {
       result = { ev: 0 };
    }


    memo.set(nodeId, result);
    return result;
  };

  for (const node of nodes) {
    if (!memo.has(node.id)) {
      calculateEvForNode(node.id);
    }
  }

  // Convert map to a plain object for the final return value
  return Object.fromEntries(memo);
}
