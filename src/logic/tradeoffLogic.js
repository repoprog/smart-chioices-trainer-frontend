// 1. Sprawdzanie, czy wiersz jest wyrównany (kompromisy)
export const checkIsRowEqualized = (rowIndex, state) => {
  const { showTradeoffs, showRanking, alternatives, rejectedAlternatives, cells } = state;
  if (!showTradeoffs && !showRanking) return false;

  const activeAlts = alternatives.map((_, i) => i).filter(i => !rejectedAlternatives.includes(i));
  if (activeAlts.length <= 1) return false;

  let firstValue = null;
  for (let c of activeAlts) {
    const val = cells[`${rowIndex}-${c}`];
    if (val === undefined || val.toString().trim() === '') return false;
    const cleanVal = val.toString().trim().toLowerCase().replace(/\s/g, '');
    if (firstValue === null) firstValue = cleanVal;
    else if (firstValue !== cleanVal) return false;
  }
  return true;
};

// 2. Pobieranie indeksów wyrównanych wierszy
export const getEqualizedRowsIndexes = (state) => {
  return state.objectives.map((_, i) => i).filter(i => checkIsRowEqualized(i, state));
};

// 3. Liczenie rankingu dla konkretnego wiersza
export const getRowRanks = (rowIndex, state) => {
  const { alternatives, rejectedAlternatives, cells, customScales, sortDirections } = state;
  const activeAlts = alternatives.map((_, i) => i).filter(i => !rejectedAlternatives.includes(i));

  const rowData = activeAlts.map(colIndex => {
    const val = cells[`${rowIndex}-${colIndex}`];
    return { colIndex, value: val !== undefined ? val.trim() : '' };
  });

  const nonEmpty = rowData.filter(item => item.value !== '');
  const scaleMap = {};
  customScales.forEach(s => {
    scaleMap[s.word.trim().toLowerCase()] = parseFloat(s.rank.replace(',', '.'));
  });

 const getMappedValue = (str) => {
    const lowerStr = str.trim().toLowerCase();
    
    // ZAMIAST hasOwnProperty używamy bezpiecznego operatora "in":
    if (lowerStr in scaleMap) return scaleMap[lowerStr];
    
    const match = str.replace(/\s/g, '').match(/-?[\d]+(?:[.,][\d]+)?/);
    if (match) return parseFloat(match[0].replace(',', '.'));
    
    return NaN;
  };

  const isNumericOrScale = nonEmpty.length > 0 && nonEmpty.every(item => !isNaN(getMappedValue(item.value)));
  const isLowerBetter = sortDirections[rowIndex] === 'lower';

  if (isNumericOrScale) {
    nonEmpty.sort((a, b) => {
      const valA = getMappedValue(a.value);
      const valB = getMappedValue(b.value);
      return isLowerBetter ? valA - valB : valB - valA;
    });
  } else {
    nonEmpty.sort((a, b) => isLowerBetter ? a.value.localeCompare(b.value) : b.value.localeCompare(a.value));
  }

  const ranks = {};
  let currentRank = 1;
  nonEmpty.forEach((item, index) => {
    if (index > 0) {
      const prevItem = nonEmpty[index - 1];
      const isSame = isNumericOrScale 
        ? getMappedValue(prevItem.value) === getMappedValue(item.value) 
        : prevItem.value.toLowerCase() === item.value.toLowerCase();
      if (!isSame) currentRank++;
    }
    ranks[item.colIndex] = currentRank;
  });
  return ranks;
};

// 4. Analiza Dominacji (kto z kim wygrywa)
export const analyzeDomination = (state, equalizedRowsIndexes) => {
  const { objectives, alternatives, rejectedAlternatives, cells } = state;
  const matrix = {};
  
  objectives.forEach((_, r) => {
    matrix[r] = getRowRanks(r, state);
  });

  const results = {};
  const activeObjectives = objectives.map((_, r) => r).filter(r => {
    if (equalizedRowsIndexes.includes(r)) return false; 
    
    const activeAlts = alternatives.map((_, i) => i).filter(i => !rejectedAlternatives.includes(i));
    return activeAlts.some(c => cells[`${r}-${c}`] && cells[`${r}-${c}`].toString().trim() !== ''); 
  });

  const isColComplete = (c) => activeObjectives.every(r => cells[`${r}-${c}`] && cells[`${r}-${c}`].toString().trim() !== '');

  for (let a = 0; a < alternatives.length; a++) {
    if (rejectedAlternatives.includes(a) || !isColComplete(a)) continue;

    let strictlyBy = null;
    let practicallyBy = null;
    let practicalObjName = null;

    for (let b = 0; b < alternatives.length; b++) {
      if (a === b || rejectedAlternatives.includes(b) || !isColComplete(b)) continue;

      let bIsAlwaysBetterOrEqual = true;
      let bIsStrictlyBetterAtLeastOnce = false;
      let aExceptionsCount = 0;
      let aExceptionRow = -1;
      let aExceptionRankDiff = 0;

      for (let r of activeObjectives) {
        const rankA = matrix[r][a];
        const rankB = matrix[r][b];

        if (rankB < rankA) {
          bIsStrictlyBetterAtLeastOnce = true;
        } else if (rankB > rankA) {
          bIsAlwaysBetterOrEqual = false;
          aExceptionsCount++;
          aExceptionRow = r;
          aExceptionRankDiff = rankB - rankA;
        }
      }

      if (bIsAlwaysBetterOrEqual && bIsStrictlyBetterAtLeastOnce) {
        strictlyBy = alternatives[b];
        break;
      }
      if (aExceptionsCount === 1 && aExceptionRankDiff === 1 && bIsStrictlyBetterAtLeastOnce) {
        practicallyBy = alternatives[b];
        practicalObjName = objectives[aExceptionRow];
      }
    }
    
    if (strictlyBy) results[a] = { type: 'strict', by: strictlyBy };
    else if (practicallyBy) results[a] = { type: 'practical', by: practicallyBy, objective: practicalObjName };
  }
  
  return { results, matrix };
};

// ============================================================================
// 5. GŁÓWNA FUNKCJA DLA KOMPONENTU REACT (MASTER FUNCTION)
// ============================================================================
export const getTradeoffResults = (state) => {
  const { showRanking, alternatives, objectives, rejectedAlternatives, cells } = state;

  const equalizedRowsIndexes = getEqualizedRowsIndexes(state);
  const equalizedCount = equalizedRowsIndexes.length;

  const { results: dominationResults, matrix: currentMatrix } = showRanking 
    ? analyzeDomination(state, equalizedRowsIndexes)
    : { results: {}, matrix: {} };

  const activeAlts = alternatives.map((_, i) => i).filter(i => !rejectedAlternatives.includes(i));
  const activeObjForCheck = objectives.map((_, r) => r).filter(r => !equalizedRowsIndexes.includes(r));
  
  const completeAlts = activeAlts.filter(c => {
    return activeObjForCheck.every(r => cells[`${r}-${c}`] !== undefined && cells[`${r}-${c}`].toString().trim() !== '');
  });

  let winnerIndex = null;
  
  if (showRanking && completeAlts.length > 0) {
    if (completeAlts.length === 1) {
      winnerIndex = completeAlts[0];
    } else if (activeObjForCheck.length > 0) {
      const perfectAlts = completeAlts.filter(c => activeObjForCheck.every(r => currentMatrix[r] && currentMatrix[r][c] === 1));
      
      if (perfectAlts.length === 1) {
        winnerIndex = perfectAlts[0];
      } else {
        const contenders = completeAlts.filter(idx => !dominationResults[idx] || dominationResults[idx].type !== 'strict');
        if (contenders.length === 1) {
          winnerIndex = contenders[0];
        }
      }
    }
  }

  // Zwracamy paczkę gotowych danych do narysowania w tabeli
  return {
    equalizedRowsIndexes,
    equalizedCount,
    dominationResults,
    currentMatrix,
    activeAlts,
    activeObjForCheck,
    completeAlts,
    winnerIndex
  };
};