import { scalePresets } from '../data/scalePresets'; 


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

  // 1. Słownik AKTYWNYCH ocen użytkownika (ma najwyższy priorytet)
  const activeScaleMap = Object.fromEntries(
    customScales.map(s => [s.word.trim().toLowerCase(), parseFloat(s.rank.replace(',', '.'))])
  );

  // 2. Słownik GLOBALNY (zbudowany w locie ze wszystkich Twoich predefiniowanych paczek)
  const globalScaleMap = {};
  Object.values(scalePresets).forEach(presetArray => {
    presetArray.forEach(item => {
      globalScaleMap[item.word.trim().toLowerCase()] = parseFloat(item.rank.replace(',', '.'));
    });
  });

  // 3. Inteligentny Parser
  const getMappedValue = (str) => {
    if (!str) return NaN;
    const lower = str.toString().trim().toLowerCase();
    
    // a) Szukamy w aktywnych (własnych) ocenach
    if (lower in activeScaleMap) return activeScaleMap[lower];
    
    // b) Szukamy w paczkach globalnych (np. "tak", "nie", "A", "B", "celujący")
    if (lower in globalScaleMap) return globalScaleMap[lower];
    
    // c) Wyciągamy liczby
    const match = lower.replace(/\s/g, '').match(/-?[\d]+(?:[.,][\d]+)?/);
    return match ? parseFloat(match[0].replace(',', '.')) : NaN;
  };

  // 4. Czysta matematyka: wyciągamy, parsujemy, wyrzucamy błędy (NaN) i sortujemy
  const isLowerBetter = sortDirections[rowIndex] === 'lower';
  const validItems = activeAlts
    .map(colIndex => ({ colIndex, mapped: getMappedValue(cells[`${rowIndex}-${colIndex}`]) }))
    .filter(item => !isNaN(item.mapped))
    .sort((a, b) => isLowerBetter ? a.mapped - b.mapped : b.mapped - a.mapped);

  // 5. Rozdajemy miejsca na podium (1, 2, 3...)
  const ranks = {};
  let currentRank = 1;
  validItems.forEach((item, index) => {
    if (index > 0 && validItems[index - 1].mapped !== item.mapped) currentRank++;
    ranks[item.colIndex] = currentRank;
  });

  return ranks;
};
// 4. Analiza Dominacji (kto z kim wygrywa) - ZREFAKTORYZOWANA
// Teraz funkcja przyjmuje gotową listę completeAlts od Głównej Funkcji
export const analyzeDomination = (state, equalizedRowsIndexes, completeAlts, activeObjForCheck) => {
  const { objectives, alternatives, rejectedAlternatives } = state;
  const matrix = {};
  
  objectives.forEach((_, r) => {
    matrix[r] = getRowRanks(r, state);
  });

  const results = {};

  for (let a = 0; a < alternatives.length; a++) {
    // BRAMKARZ 1: Sprawdzamy czy Opcja 'A' uczestniczy w grze
    if (rejectedAlternatives.includes(a) || !completeAlts.includes(a)) continue;

    let strictlyBy = null;
    let practicallyBy = null;
    let practicalObjName = null;

    for (let b = 0; b < alternatives.length; b++) {
      // BRAMKARZ 2: Opcja 'B' też musi być kompletna i nieodrzucona
      if (a === b || rejectedAlternatives.includes(b) || !completeAlts.includes(b)) continue;

      let bIsAlwaysBetterOrEqual = true;
      let bIsStrictlyBetterAtLeastOnce = false;
      let aExceptionsCount = 0;
      let aExceptionRow = -1;
      let aExceptionRankDiff = 0;

      // Pętla leci TYLKO po celach, które mają sens (nie są puste i nie są wyrównane)
      for (let r of activeObjForCheck) {
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

  const activeAlts = alternatives.map((_, i) => i).filter(i => !rejectedAlternatives.includes(i));
  
  // POPRAWKA: Inteligentne ignorowanie pustych celów ("Duchów")
  const activeObjForCheck = objectives.map((_, r) => r).filter(r => {
    // Odpadają cele wykreślone przez kompromis
    if (equalizedRowsIndexes.includes(r)) return false; 
    
    // Odpadają cele całkowicie puste (jeśli żadna opcja nic w nich nie ma, ignorujemy je)
    const hasAnyValue = activeAlts.some(c => cells[`${r}-${c}`] !== undefined && cells[`${r}-${c}`].toString().trim() !== '');
    return hasAnyValue;
  });
  
  // Wspólna prawda: Wyliczamy raz, kto jest w pełni gotowy do walki
  const completeAlts = activeAlts.filter(c => {
    return activeObjForCheck.every(r => cells[`${r}-${c}`] !== undefined && cells[`${r}-${c}`].toString().trim() !== '');
  });

  // Przekazujemy completeAlts do analizy dominacji, by korzystała z tych samych danych
  const { results: dominationResults, matrix: currentMatrix } = showRanking 
    ? analyzeDomination(state, equalizedRowsIndexes, completeAlts, activeObjForCheck)
    : { results: {}, matrix: {} };
let winnerIndex = null;
  
  // TARCZA ANTY-WALKOWEROWA: Zwycięzcę można ogłosić tylko, gdy wszyscy grający są gotowi
  const isRaceFinished = completeAlts.length === activeAlts.length;
  
  if (showRanking && completeAlts.length > 0 && isRaceFinished) {
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