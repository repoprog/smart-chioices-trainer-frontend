import { NODE_TYPES, EVALUATION_MODES } from '../../../constants/decisionTypes';

/**
 * ============================================================================
 * OPTIMISTIC UI ENGINE: LOCAL DECISION TREE MATH EVALUATOR
 * ============================================================================
 * This module acts as the fast, local math engine for the frontend. It provides
 * instant, zero-latency visual feedback when the user manipulates sliders.
 * Complex, definitive calculations are deferred to the Server-Authoritative 
 * Spring Boot backend upon user request.
 */

/**
 * CORE MECHANIC: Anti-Corruption Layer for numeric inputs.
 * Safely parses dirty string values (currencies, spaces, European/US formats) into clean floats.
 * * @param {string|number} value - The raw input from the UI (e.g., "1.234,50 zł" or "1,234.50")
 * @returns {number} The sanitized float ready for mathematical operations.
 */
export const parseValue = (value) => {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  // Normalize spaces and typographical minus signs
  let cleanStr = value.replace(/\s+/g, '').replace(/−|\u2212/g, '-');
  cleanStr = cleanStr.replace(/[^\d.,-]/g, '');

  const lastCommaIndex = cleanStr.lastIndexOf(',');
  const lastDotIndex = cleanStr.lastIndexOf('.');

  // Intelligent locale detection based on the position of commas and dots
  if (lastCommaIndex > -1 && lastDotIndex > -1) {
    if (lastCommaIndex > lastDotIndex) {
      // European format: 1.234,50
      cleanStr = cleanStr.replace(/\./g, '');
      cleanStr = cleanStr.replace(',', '.'); 
    } else {
      // US/UK format: 1,234.50
      cleanStr = cleanStr.replace(/,/g, '');
    }
  } else if (lastCommaIndex > -1) {
    cleanStr = cleanStr.replace(/,/g, '.');
  }

  const parts = cleanStr.split('.');
  if (parts.length > 2) {
    cleanStr = parts[0] + '.' + parts.slice(1).join('');
  }

  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * CORE MECHANIC: Universal probability parser (e.g., "50%" → 50).
 */
export const parseProbabilityString = (p) => {
  if (p == null) return 0;
  return parseFloat(String(p).replace('%', '').replace(',', '.')) || 0; 
};

/**
 * CORE MECHANIC: Probability normalizer (converts percentages to 0.0 - 1.0 decimals).
 * Provides graceful degradation: if a user hasn't assigned a probability, 
 * it automatically calculates an even split among unassigned siblings.
 */
export const parseProbability = (prob, allSiblings = []) => {
  if (prob != null && prob !== '') {
    return parseValue(prob) / 100;
  }
  
  const unassignedSiblings = allSiblings.filter(
    (e) => e.data?.probability == null || e.data?.probability === ''
  );
  
  return 1 / (unassignedSiblings.length || 1);
};

export const formatProbability = (p) => `${parseFloat(p).toFixed(2)}%`;

const formatEqNum = (num) => Number.isInteger(num) ? num : parseFloat(num.toFixed(2));

/**
 * CORE MECHANIC: Local Expected Monetary Value (EMV) Evaluator.
 * Uses Depth-First Search (DFS) with Memoization to trace paths from terminal leaves up to the root.
 * Note: This is an optimistic approximation. The authoritative result is calculated by Java.
 * * @param {Array} nodes - The graph nodes
 * @param {Array} edges - The graph edges
 * @param {string} optimizationMode - MIN or MAX evaluation logic
 * @returns {Object} A map containing EMV, steps, and visual equations for each node
 */
export function evaluateDecisionTree(nodes, edges, optimizationMode = EVALUATION_MODES.MAX) {
  if (!nodes || nodes.length === 0) return {};

  // Build adjacency list for O(1) edge lookups
  const outgoingEdges = new Map();
  for (const edge of edges) {
    if (!outgoingEdges.has(edge.source)) {
      outgoingEdges.set(edge.source, []);
    }
    outgoingEdges.get(edge.source).push(edge);
  }

  const nodesMap = new Map(nodes.map((node) => [node.id, node]));
  const memo = new Map(); // Cache to prevent exponential O(2^n) time complexity

  const calculateEvForNode = (nodeId) => {
    // Return cached result if already evaluated
    if (memo.has(nodeId)) return memo.get(nodeId);

    const node = nodesMap.get(nodeId);
    if (!node) return { ev: 0, steps: 0, equation: '' }; 

    const childrenEdges = outgoingEdges.get(nodeId) || [];
    let result;
    
    // 1. TERMINAL NODE (Leaf): Returns immediate payoff
    if (node.type === NODE_TYPES.TERMINAL || childrenEdges.length === 0) {
      const payoff = parseValue(node.data?.payoff);
      result = { ev: payoff, steps: 0, equation: `${formatEqNum(payoff)}` }; 
    } 
    // 2. CHANCE NODE: Calculates weighted average of all potential outcomes
    else if (node.type === NODE_TYPES.CHANCE) {
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
    // 3. DECISION NODE: Applies Min/Max optimization to select the most lucrative branch
    else if (node.type === NODE_TYPES.DECISION) {
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
            if (optimizationMode === EVALUATION_MODES.MAX) {
              if (current.ev > best.ev) return current;
              if (current.ev === best.ev && current.steps < best.steps) return current; // Tie-breaker: shortest path
            } else {
              if (current.ev < best.ev) return current;
              if (current.ev === best.ev && current.steps < best.steps) return current;
            }
            return best;
          },
          { ev: optimizationMode === EVALUATION_MODES.MAX ? -Infinity : Infinity, steps: Infinity, edgeId: null }
        );
        
        const operator = optimizationMode === EVALUATION_MODES.MAX ? EVALUATION_MODES.MAX : EVALUATION_MODES.MIN;
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
 * Automatically distributes the remaining probability pool equally among unlocked branches.
 * Keeps the math sound (summing to 100%) while the user experiments with sliders.
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
              // Final branch absorbs any rounding discrepancies to perfectly hit 100%
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
 * CORE MECHANIC: Cumulative Risk/Probability Calculator.
 * Employs Breadth-First Search (BFS) to calculate the cumulative probability of reaching any given node from the root.
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
      if (node?.type === NODE_TYPES.CHANCE) {
        const edgeP = parseProbability(edge.data?.probability);
        nextProb = currentProb * edgeP;
      }
      queue.push({ id: edge.target, currentProb: nextProb });
    });
  }
  return probMap;
}

/**
 * CORE MECHANIC: The Main Evaluation Pipeline.
 * Orchestrates the full graph evaluation: Validates state -> Calculates local EMV -> Traces optimal path.
 * Injects a 'dataVersion' timestamp acting as an Optimistic Concurrency Control (OCC) token.
 */
export const evaluateAndSetWinningPath = (state) => {
  const { nodes, edges, evaluationMode } = state;
  
  let hasProbabilityError = false;
  
  // 1. Guard Clause: Validation Step. Abort math if the graph state is mathematically impossible.
  for (const node of nodes) {
    if (node.type === NODE_TYPES.CHANCE) {
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

  // 2. State Degredation: Clear visual results if the tree is invalid.
  if (hasProbabilityError) {
    const nodesWithoutEv = nodes.map(node => {
      const newData = { ...node.data };
      delete newData.expectedValue;
      delete newData.equation;
      return { ...node, data: newData };
    });
    // Generate a fresh OCC token (dataVersion) even on error to invalidate stale server responses
    return { ...state, nodes: nodesWithoutEv, evaluationMap: {}, winningPath: [], dataVersion: Date.now() };
  }

  // 3. Normal Pipeline Execution
  const evaluationMap = evaluateDecisionTree(nodes, edges, evaluationMode);
  const cumulativeProbs = calculatePathProbabilities(nodes, edges);

  // Hydrate nodes with evaluated data
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
  
  // 4. Critical Path Tracing (BFS based on bestEdgeId)
  const winningPathSet = new Set();
  
  const rootNode = nodesWithEv.find((n) => (n.type === NODE_TYPES.DECISION || n.type === NODE_TYPES.CHANCE) && !edges.some((e) => e.target === n.id));
  if (rootNode) {
    const queue = [rootNode.id];
    winningPathSet.add(rootNode.id);

    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      const currentNode = nodesWithEv.find((n) => n.id === currentNodeId);
      const evaluationResult = evaluationMap[currentNodeId];

      if (currentNode?.type === NODE_TYPES.DECISION && evaluationResult?.optimalEdgeId) {
        const optimalEdge = edges.find((e) => e.id === evaluationResult.optimalEdgeId);
        if (optimalEdge) {
          winningPathSet.add(optimalEdge.id);
          winningPathSet.add(optimalEdge.target);
          queue.push(optimalEdge.target);
        }
      } else {
        const childEdges = edges.filter((e) => e.source === currentNodeId);
        childEdges.forEach((edge) => {
          if(currentNode?.type === NODE_TYPES.CHANCE) {
             winningPathSet.add(edge.id);
             winningPathSet.add(edge.target);
             queue.push(edge.target);
          }
        });
      }
    }
  }
  
  return { 
    ...state, 
    nodes: nodesWithEv, 
    evaluationMap, 
    winningPath: Array.from(winningPathSet),
    dataVersion: Date.now() // OCC Token generation for Race Condition prevention
  };
};