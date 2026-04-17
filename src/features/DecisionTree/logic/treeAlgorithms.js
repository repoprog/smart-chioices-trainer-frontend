/**
 * CORE MECHANIC: Parses string values into numbers for math operations.
 * Handles currency, percentages, and European number formatting (comma to dot).
 */
export const parseValue = (value) => {
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

/**
 * CORE MECHANIC: Parses probability percentages into decimals (0.0 to 1.0).
 * Falls back to an even split among unassigned siblings if no value exists.
 */
export const parseProbability = (prob, allSiblings = [], edge = null) => {
  if (prob != null) {
    return parseValue(prob) / 100;
  }
  const unassignedSiblings = allSiblings.filter(
    (e) => e.data?.probability == null
  );
  return 1 / (unassignedSiblings.length || 1);
};

export const formatProbability = (p) => `${parseFloat(p).toFixed(2)}%`;

const formatEqNum = (num) => Number.isInteger(num) ? num : parseFloat(num.toFixed(2));

/**
 * CORE MECHANIC: Recursive evaluation of the Decision Tree to calculate Expected Monetary Value (EMV).
 * Traverses from terminal nodes back to the root, resolving chance nodes (weighted average) 
 * and decision nodes (max/min optimization).
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
    if (memo.has(nodeId)) return memo.get(nodeId);

    const node = nodesMap.get(nodeId);
    if (!node) return { ev: 0, steps: 0, equation: '' }; 

    const childrenEdges = outgoingEdges.get(nodeId) || [];
    let result;
    
    // 1. TERMINAL NODE
    if (node.type === 'terminal' || childrenEdges.length === 0) {
      const payoff = parseValue(node.data?.payoff);
      result = { ev: payoff, steps: 0, equation: `${formatEqNum(payoff)}` }; 
    } 
    // 2. CHANCE NODE (Weighted Average calculation)
    else if (node.type === 'chance') {
      let expectedSteps = 0;
      let equationParts = [];
      
      const totalEv = childrenEdges.reduce((sum, edge) => {
        const edgeCost = parseValue(edge.data?.cost);
        const probability = parseProbability(edge.data?.probability, childrenEdges, edge);
        const childResult = calculateEvForNode(edge.target);
        
        expectedSteps += (childResult.steps + 1) * probability; 
        const branchValue = childResult.ev + edgeCost;
        
        equationParts.push(`(${formatEqNum(probability)} × ${formatEqNum(branchValue)})`);
        return sum + branchValue * probability;
      }, 0);
      
      result = { 
        ev: totalEv, 
        steps: expectedSteps, 
        equation: equationParts.join(' + ') 
      };
    } 
    // 3. DECISION NODE (Optimization calculation)
    else if (node.type === 'decision') {
      let equationParts = [];
      
      const childValues = childrenEdges.map((edge) => {
        const edgeCost = parseValue(edge.data?.cost);
        const childResult = calculateEvForNode(edge.target);
        const branchValue = childResult.ev + edgeCost;
        
        equationParts.push(formatEqNum(branchValue));
        return { ev: branchValue, steps: childResult.steps + 1, edgeId: edge.id };
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

/**
 * CORE MECHANIC: Auto-balancer for 'What-If' scenarios.
 * Automatically distributes remaining probability (100% - locked) equally among unlocked branches.
 */
export function rebalanceProbabilities(edges, sourceId) {
  const childEdges = edges.filter(e => e.source === sourceId);
  if (childEdges.length === 0) return edges;

  const lockedEdges = childEdges.filter(e => e.data.isLocked);
  const unlockedEdges = childEdges.filter(e => !e.data.isLocked);

  const lockedTotal = lockedEdges.reduce((sum, e) => sum + (parseProbability(e.data.probability) * 100), 0);
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
                  data: { ...updatedEdges[edgeIndex].data, probability: formatProbability(newProb) },
              };
          }
      });
  }
  return updatedEdges;
}

/**
 * CORE MECHANIC: Calculate cumulative path probabilities from root down to all nodes.
 */
export function calculatePathProbabilities(nodes, edges) {
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
        const edgeP = parseProbability(edge.data?.probability);
        nextProb = currentProb * edgeP;
      }
      queue.push({ id: edge.target, currentProb: nextProb });
    });
  }
  return probMap;
}

/**
 * CORE MECHANIC: Main pipeline function to trace the optimal route based on EMV evaluations.
 * Validates probabilities FIRST and aborts calculation if mathematically impossible state is detected.
 */
export const evaluateAndSetWinningPath = (state) => {
  const { nodes, edges, evaluationMode } = state;
  
  let hasProbabilityError = false;
  
  // 1. Validation Step: Check for probability math errors first
  for (const node of nodes) {
    if (node.type === 'chance') {
      const outgoingEdges = edges.filter((e) => e.source === node.id);
      if (outgoingEdges.length > 0) {
        const sum = outgoingEdges.reduce((acc, e) => acc + (parseProbability(e.data?.probability) * 100), 0);
        if (Math.abs(sum - 100) > 0.01) {
          hasProbabilityError = true;
          break; 
        }
      }
    }
  }

  // 2. Abort calculating Expected Value if tree is mathematically invalid
  if (hasProbabilityError) {
    const nodesWithoutEv = nodes.map(node => {
      const newData = { ...node.data };
      delete newData.expectedValue;
      delete newData.equation;
      return { ...node, data: newData };
    });
    return { ...state, nodes: nodesWithoutEv, evaluationMap: {}, winningPath: [] };
  }

  // 3. Normal evaluation if math is correct
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
  
  const winningPathSet = new Set();
  
  const rootNode = nodesWithEv.find((n) => (n.type === 'decision' || n.type === 'chance') && !edges.some((e) => e.target === n.id));
  if (rootNode) {
    const queue = [rootNode.id];
    winningPathSet.add(rootNode.id);

    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      const currentNode = nodesWithEv.find((n) => n.id === currentNodeId);
      const evaluationResult = evaluationMap[currentNodeId];

      if (currentNode?.type === 'decision' && evaluationResult?.optimalEdgeId) {
        const optimalEdge = edges.find((e) => e.id === evaluationResult.optimalEdgeId);
        if (optimalEdge) {
          winningPathSet.add(optimalEdge.id);
          winningPathSet.add(optimalEdge.target);
          queue.push(optimalEdge.target);
        }
      } else {
        const childEdges = edges.filter((e) => e.source === currentNodeId);
        childEdges.forEach((edge) => {
          if(currentNode?.type === 'chance') {
             winningPathSet.add(edge.id);
             winningPathSet.add(edge.target);
             queue.push(edge.target);
          }
        });
      }
    }
  }
  
 return { ...state, nodes: nodesWithEv, evaluationMap, winningPath: Array.from(winningPathSet) };
};