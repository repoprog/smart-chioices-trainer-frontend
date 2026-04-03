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

// NOWA FUNKCJA: Formatuje liczby do równania (usuwa zera po przecinku jeśli to liczba całkowita)
const formatEqNum = (num) => Number.isInteger(num) ? num : parseFloat(num.toFixed(2));

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
      return { ev: 0, steps: 0, equation: '' }; 
    }

    const childrenEdges = outgoingEdges.get(nodeId) || [];

    let result;
    
    // 1. TERMINAL NODE
    if (node.type === 'terminal' || childrenEdges.length === 0) {
      const payoff = parseValue(node.data?.payoff);
      // Liść po prostu zwraca swoją wartość jako początek równania
      result = { ev: payoff, steps: 0, equation: `${formatEqNum(payoff)}` }; 
    } 
    // 2. CHANCE NODE
    else if (node.type === 'chance') {
      let expectedSteps = 0;
      let equationParts = [];
      
      const totalEv = childrenEdges.reduce((sum, edge) => {
        const edgeCost = parseValue(edge.data?.cost);
        const probability = parseProbability(edge.data?.probability, childrenEdges, edge);
        const childResult = calculateEvForNode(edge.target);
        
        expectedSteps += (childResult.steps + 1) * probability; 
        
        const branchValue = childResult.ev + edgeCost;
        
        // Zapisujemy fragment równania dla danej gałęzi, np. (0.6 × 100)
        equationParts.push(`(${formatEqNum(probability)} × ${formatEqNum(branchValue)})`);
        
        return sum + branchValue * probability;
      }, 0);
      
      result = { 
        ev: totalEv, 
        steps: expectedSteps, 
        // Sklejamy części plusem: (0.6 × 100) + (0.4 × 0)
        equation: equationParts.join(' + ') 
      };
    } 
    // 3. DECISION NODE
    else if (node.type === 'decision') {
      let equationParts = [];
      
      const childValues = childrenEdges.map((edge) => {
        const edgeCost = parseValue(edge.data?.cost);
        const childResult = calculateEvForNode(edge.target);
        const branchValue = childResult.ev + edgeCost;
        
        equationParts.push(formatEqNum(branchValue));

        return {
          ev: branchValue,
          steps: childResult.steps + 1,
          edgeId: edge.id,
        };
      });

      if (childValues.length === 0) {
        result = { ev: 0, steps: 0, equation: '0' };
      } else {
        const bestResult = childValues.reduce(
          (best, current) => {
            if (optimizationMode === 'max') {
              if (current.ev > best.ev) return current;
              if (current.ev === best.ev && current.steps < best.steps) return current;
            } else {
              if (current.ev < best.ev) return current;
              if (current.ev === best.ev && current.steps < best.steps) return current;
            }
            return best;
          },
          { ev: optimizationMode === 'max' ? -Infinity : Infinity, steps: Infinity, edgeId: null }
        );
        
        const operator = optimizationMode === 'max' ? 'MAX' : 'MIN';
        result = { 
          ev: bestResult.ev, 
          steps: bestResult.steps, 
          optimalEdgeId: bestResult.edgeId,
          // Sklejamy operację decyzji: MAX(100, 50)
          equation: `${operator}(${equationParts.join(', ')})` 
        };
      }
    } else {
       result = { ev: 0, steps: 0, equation: '' };
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