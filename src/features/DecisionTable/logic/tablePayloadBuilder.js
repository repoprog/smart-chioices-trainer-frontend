import { scalePresets } from '../data/scalePresets.js';
import { SORT_DIRECTIONS } from '../../../constants/decisionTypes.js';
import { parseValue } from '../../../utils/numberParser.js'; // <--- WSPÓŁDZIELONY IMPORT

const GLOBAL_SCALE_MAP = (() => {
  const map = {};
  Object.values(scalePresets).forEach(presetArray => {
    presetArray.forEach(({ word, rank }) => {
      map[word.trim().toLowerCase()] = parseFloat(rank.replace(',', '.'));
    });
  });
  return map;
})();

export const resolveTableCellValue = (rawValue, customScales) => {
  if (rawValue === null || rawValue === undefined || rawValue.toString().trim() === '') {
    return null;
  }

  // ZMIANA: Normalizujemy znak unicode minusa na standardowy myślnik ASCII (przed jakimkolwiek sprawdzaniem)
  const normalized = rawValue.toString().replace(/−|\u2212/g, '-');
  const lower = normalized.trim().toLowerCase();

  // 1. Skale użytkownika (najwyższy priorytet)
  for (const scale of customScales) {
    if (scale.word.trim().toLowerCase() === lower) {
      const parsed = parseFloat(scale.rank.replace(',', '.'));
      return isNaN(parsed) ? null : parsed;
    }
  }

  // 2. Predefiniowane skale tekstowe (np. "Wysoki" -> 5)
  if (lower in GLOBAL_SCALE_MAP) { 
    return GLOBAL_SCALE_MAP[lower];
  }

  // 3. Ekstrakcja numeryczna za pomocą naszego pancernego parsera (zabezpieczenie przed wpisaniem samych liter)
  // Używamy znormalizowanego tekstu, więc minus typograficzny z Excela nam niestraszny
  const cleanStrForCheck = normalized.replace(/[^\d.,-]/g, '');
  if (cleanStrForCheck === '' || cleanStrForCheck === '-') return null;

  const parsedNum = parseValue(normalized);
  return isNaN(parsedNum) ? null : parsedNum;
};

const computeEqualizedRows = (objectives, alternatives, cells, rejectedAlternatives) => {
  const activeAlts = alternatives.map((_, i) => i).filter(i => !rejectedAlternatives.includes(i));
  if (activeAlts.length <= 1) return [];

  return objectives.reduce((equalizedRows, _, r) => {
    let firstValue = null;
    const allEqual = activeAlts.every(c => {
      const val = cells[`${r}-${c}`];
      if (!val || val.toString().trim() === '') return false;
      const normalized = val.toString().trim().toLowerCase().replace(/\s/g, '');
      if (firstValue === null) { firstValue = normalized; return true; }
      return firstValue === normalized;
    });

    if (allEqual && firstValue !== null) equalizedRows.push(r);
    return equalizedRows;
  }, []);
};

export function buildTableAnalysisPayload(store) {
  // WYCIĄGAMY DODATKOWE FLAGI Z UI (showRanking, showTradeoffs)
  const { 
    alternatives, 
    objectives, 
    cells, 
    sortDirections, 
    customScales, 
    rejectedAlternatives,
    showRanking, 
    showTradeoffs 
  } = store;

  // 1. Zidentyfikuj całkowicie puste kolumny ("duchy")
  const completelyEmptyAlts = alternatives.map((_, i) => i).filter(c => {
     return !objectives.some((_, r) => {
        const val = cells[`${r}-${c}`];
        return val !== undefined && val !== null && val.toString().trim() !== '';
     });
  });

  // 2. Połącz te, które użytkownik sam odrzucił, z całkowicie pustymi (bez duplikatów)
  const combinedRejected = [...new Set([...rejectedAlternatives, ...completelyEmptyAlts])];

  const resolvedMatrix = {};
  for (let r = 0; r < objectives.length; r++) {
    for (let c = 0; c < alternatives.length; c++) {
      const resolved = resolveTableCellValue(cells[`${r}-${c}`], customScales);
      if (resolved !== null) {
        resolvedMatrix[`${r}-${c}`] = resolved;
      }
    }
  }

  // 3. ŁATKA Z AUDYTU: Wyrównane wiersze mają sens tylko gdy ranking lub tradeoffs są aktywne.
  // Używamy też 'combinedRejected', by wiersze nie blokowały się przez puste kolumny.
  const equalizedCriterionIndices = (showRanking || showTradeoffs)
    ? computeEqualizedRows(objectives, alternatives, cells, combinedRejected)
    : [];

  return {
    alternatives: alternatives.map((name, index) => ({ index, name })),
    criteria: objectives.map((name, index) => ({
      index,
      name,
     sortDirection: String(sortDirections[index] || SORT_DIRECTIONS.HIGHER).toUpperCase(),
    })),
    resolvedMatrix,
    rejectedAlternativeIndices: combinedRejected,
    equalizedCriterionIndices: equalizedCriterionIndices,
  };
}