/**
 * Transforms frontend node and edge structures into a clean payload for Java backend analysis.
 */

// OSTRZEŻENIE 5 z audytu: Odporność na spacje typograficzne
const parseProbability = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const cleanStr = String(value)
    .replace(/\s+/g, '') 
    .replace('%', '')
    .replace(',', '.')
    .trim();
    
  if (cleanStr === '') return null;
  const num = Number(cleanStr);
  return isNaN(num) ? null : num / 100;
};

const parseCurrency = (value) => {
  if (value === null || value === undefined || value === '') return null;
  
  let cleanStr = String(value)
    .replace(/\s+/g, '')
    .replace(/−|\u2212/g, '-')  //  unicode
    .replace(/[^\d.,-]/g, '');
    
  if (cleanStr === '' || cleanStr === '-') return null;
  
  const lastComma = cleanStr.lastIndexOf(',');
  const lastDot = cleanStr.lastIndexOf('.');
  
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.'); // PL: 1.234,50
    } else {
      cleanStr = cleanStr.replace(/,/g, '');                    // EN: 1,234.50
    }
  } else if (lastComma > -1) {
    cleanStr = cleanStr.replace(',', '.');
  }
  
  const num = Number(cleanStr);
  return isNaN(num) ? null : num;
};

export function buildTreeAnalysisPayload(nodes, edges, evaluationMode) {
  const mappedNodes = nodes.map(node => ({
    id: node.id,
    type: node.type,
    data: {
      payoff: node.data && node.data.payoff !== undefined ? parseCurrency(node.data.payoff) : null,
      probability: node.data && node.data.probability !== undefined ? parseProbability(node.data.probability) : null
    }
  }));

  const mappedEdges = edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    data: {
      cost: edge.data && edge.data.cost !== undefined ? parseCurrency(edge.data.cost) : null,
      probability: edge.data && edge.data.probability !== undefined ? parseProbability(edge.data.probability) : null
    }
  }));

  return {
    nodes: mappedNodes,
    edges: mappedEdges,
    evaluationMode: (evaluationMode || 'MAX').toUpperCase()
  };
}
