// Pomocnicze funkcje parseValue i parseProbability zostają bez zmian
const parseValue = (value) => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  const numberString = value
    .replace(/zł/g, '')
    .replace(/%/g, '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace('−', '-'); 
//100win reads as 100 number
  const parsed = parseFloat(numberString);
  return isNaN(parsed) ? 0 : parsed;
};

const parseProbability = (prob, allSiblings) => {
  if (prob != null) {
    return parseValue(prob) / 100;
  }
  const unassignedSiblings = allSiblings.filter(
    (edge) => edge.data?.probability == null
  );
  return 1 / (unassignedSiblings.length || 1);
};

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
      return { ev: 0, steps: 0 }; 
    }

    const childrenEdges = outgoingEdges.get(nodeId) || [];

    let result;
    
    // 1. TERMINAL NODE
    if (node.type === 'terminal' || childrenEdges.length === 0) {
      const payoff = parseValue(node.data?.payoff);
      result = { ev: payoff, steps: 0 }; // Liść to 0 kroków dalej
    } 
    // 2. CHANCE NODE
    else if (node.type === 'chance') {
      let expectedSteps = 0;
      const totalEv = childrenEdges.reduce((sum, edge) => {
        const edgeCost = parseValue(edge.data?.cost);
        const probability = parseProbability(edge.data?.probability, childrenEdges, edge);
        const childResult = calculateEvForNode(edge.target);
        
        // Średnia liczba kroków dla tego zdarzenia
        expectedSteps += (childResult.steps + 1) * probability; 
        
        return sum + (childResult.ev + edgeCost) * probability;
      }, 0);
      result = { ev: totalEv, steps: expectedSteps };
    } 
    // 3. DECISION NODE
    else if (node.type === 'decision') {
      const childValues = childrenEdges.map((edge) => {
        const edgeCost = parseValue(edge.data?.cost);
        const childResult = calculateEvForNode(edge.target);
        return {
          ev: childResult.ev + edgeCost,
          steps: childResult.steps + 1, // Każda decyzja to +1 krok
          edgeId: edge.id,
        };
      });

      if (childValues.length === 0) {
        result = { ev: 0, steps: 0 };
      } else if (optimizationMode === 'max') {
        result = childValues.reduce(
          (best, current) => {
            // TIE-BREAKER: Jeśli wyższe EV -> bierzemy to
            if (current.ev > best.ev) return current;
            // TIE-BREAKER: Jeśli równe EV -> bierzemy krótszą ścieżkę!
            if (current.ev === best.ev && current.steps < best.steps) return current;
            return best;
          },
          { ev: -Infinity, steps: Infinity, edgeId: null }
        );
      } else {
        result = childValues.reduce(
          (best, current) => {
            if (current.ev < best.ev) return current;
            // TIE-BREAKER: Krótsza ścieżka przy równym EV
            if (current.ev === best.ev && current.steps < best.steps) return current;
            return best;
          },
          { ev: Infinity, steps: Infinity, edgeId: null }
        );
      }
      result = { ev: result.ev, steps: result.steps, optimalEdgeId: result.edgeId };
    } else {
       result = { ev: 0, steps: 0 };
    }

    memo.set(nodeId, result);
    return result;
  };

  for (const node of nodes) {
    if (!memo.has(node.id)) {
      calculateEvForNode(node.id);
    }
  }

  return Object.fromEntries(memo);
}