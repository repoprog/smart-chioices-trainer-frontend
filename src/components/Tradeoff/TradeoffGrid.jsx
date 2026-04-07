import { useTradeoffStore } from '../../store/useTradeOffStore';
import { getTradeoffResults, getRowRanks } from '../../logic/tradeoffLogic';

const IconEye = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const IconEyeOff = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

export function TradeoffGrid() {
    const store = useTradeoffStore();
    
    const { 
        alternatives, objectives, cells, objectiveUnits, showRanking, sortDirections, 
        showTradeoffs, originalCells, hideEqualizedObjectives, rejectedAlternatives, showRejected,
        toggleShowRejected, toggleHideEqualized, toggleSortDirection,
        addAlternative, addObjective, updateAlternative, updateObjective, updateCell, updateUnit,
        rejectAlternative, restoreAlternative
    } = store;

    const { 
        equalizedRowsIndexes, equalizedCount, dominationResults, 
        winnerIndex, completeAlts
    } = getTradeoffResults(store);

    const handleRemoveAlternative = (indexToRemove) => {
        const hasData = objectives.some((_, r) => cells[`${r}-${indexToRemove}`] && cells[`${r}-${indexToRemove}`].toString().trim() !== '');
        if (hasData) {
            if (!window.confirm(`Alternatywa "${alternatives[indexToRemove]}" zawiera wpisane dane. Czy na pewno chcesz ją usunąć?`)) return;
        }

        useTradeoffStore.setState((state) => {
            const newAlternatives = state.alternatives.filter((_, index) => index !== indexToRemove);
            const newCells = {};
            for (let r = 0; r < state.objectives.length; r++) {
                for (let c = 0; c < state.alternatives.length; c++) {
                    if (c === indexToRemove) continue;
                    const newC = c > indexToRemove ? c - 1 : c;
                    if (state.cells[`${r}-${c}`] !== undefined) newCells[`${r}-${newC}`] = state.cells[`${r}-${c}`];
                }
            }
            return { 
                alternatives: newAlternatives, 
                cells: newCells,
                rejectedAlternatives: state.rejectedAlternatives.filter(c => c !== indexToRemove).map(c => c > indexToRemove ? c - 1 : c)
            };
        });
    };

    const handleRemoveObjective = (indexToRemove) => {
        const hasData = alternatives.some((_, c) => cells[`${indexToRemove}-${c}`] && cells[`${indexToRemove}-${c}`].toString().trim() !== '');
        if (hasData) {
            if (!window.confirm(`Cel "${objectives[indexToRemove]}" zawiera wpisane dane. Czy na pewno chcesz go usunąć?`)) return;
        }

        useTradeoffStore.setState((state) => {
            const newObjectives = state.objectives.filter((_, index) => index !== indexToRemove);
            const newCells = {};
            for (let r = 0; r < state.objectives.length; r++) {
                if (r === indexToRemove) continue;
                const newR = r > indexToRemove ? r - 1 : r;
                for (let c = 0; c < state.alternatives.length; c++) {
                    if (state.cells[`${r}-${c}`] !== undefined) newCells[`${newR}-${c}`] = state.cells[`${r}-${c}`];
                }
            }
            
            const newSortDirections = {};
            Object.keys(state.sortDirections).forEach(key => {
                const k = parseInt(key);
                if (k === indexToRemove) return;
                const newK = k > indexToRemove ? k - 1 : k;
                newSortDirections[newK] = state.sortDirections[k];
            });

            const newObjectiveUnits = {};
            Object.keys(state.objectiveUnits).forEach(key => {
                const k = parseInt(key);
                if (k === indexToRemove) return;
                const newK = k > indexToRemove ? k - 1 : k;
                newObjectiveUnits[newK] = state.objectiveUnits[k];
            });

            return { objectives: newObjectives, cells: newCells, sortDirections: newSortDirections, objectiveUnits: newObjectiveUnits };
        });
    };

    return (
        <div className="overflow-x-auto pb-4">
            <table className={`w-full table-fixed border-separate border-spacing-0 border border-gray-200 rounded-lg transition-all duration-300 ${showTradeoffs ? 'border-t-4 border-t-purple-500 border-purple-300 shadow-[0_4px_20px_-2px_rgba(139,92,246,0.15)]' : ''}`}>
                <colgroup>
                    <col className="w-[360px]" />
                    {alternatives.map((_, i) => (
                        <col key={i} className={`min-w-[150px] ${rejectedAlternatives.includes(i) && !showRejected ? 'hidden' : ''}`} />
                    ))}
                </colgroup>
                <thead>
                    <tr>
                        <th className="text-center sticky left-0 top-0 z-[12] bg-gray-50 shadow-[inset_-1px_-1px_0_#e5e7eb] px-4 py-3 align-middle font-semibold text-gray-600 text-[13px] uppercase tracking-wide">
                            <div className="flex justify-center items-center gap-2.5 text-gray-400 text-xs font-medium whitespace-nowrap">
                                {objectives.length === 0 && (
                                    <span className="inline-flex items-center text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-dashed border-indigo-200">Dodaj cel →</span>
                                )}
                                <button className="inline-flex justify-center items-center bg-white text-gray-400 font-bold cursor-pointer transition-all border border-gray-200 w-7 h-7 rounded-lg text-lg leading-none enabled:hover:border-gray-300 enabled:hover:text-gray-600 enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0" onClick={addObjective} title="Dodaj cel" disabled={showRanking}>+</button>
                                <span>{objectives.length} Cele / {alternatives.length} Alternatywy</span>
                                <button className="inline-flex justify-center items-center bg-white text-gray-400 font-bold cursor-pointer transition-all border border-gray-200 w-7 h-7 rounded-lg text-lg leading-none enabled:hover:border-gray-300 enabled:hover:text-gray-600 enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0" onClick={addAlternative} title="Dodaj alternatywę" disabled={showRanking}>+</button>
                                {alternatives.length === 0 && (
                                    <span className="inline-flex items-center text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-dashed border-indigo-200">← Dodaj opcję</span>
                                )}
                            </div>
                        </th>
                        
                        {alternatives.map((alt, colIndex) => {
                            const domType = showRanking && dominationResults[colIndex] ? dominationResults[colIndex].type : null;
                            const isRejected = rejectedAlternatives.includes(colIndex);
                            const isWinner = winnerIndex === colIndex;

                            let colClass = "bg-gray-50";
                            if (isWinner) colClass = "bg-green-50";
                            else if (domType === 'strict') colClass = "bg-red-50";
                            else if (domType === 'practical') colClass = "bg-amber-50";

                            if (isRejected && !showRejected) colClass += " hidden";
                            if (isRejected && showRejected) colClass += " opacity-40 bg-gray-50";

                            let headerColor = 'text-gray-500';
                            if (isWinner) headerColor = 'text-green-700';
                            else if (domType === 'strict') headerColor = 'text-red-700';
                            else if (domType === 'practical') headerColor = 'text-amber-600';

                            return (
                                <th key={`col-${colIndex}`} className={`p-1.5 align-middle overflow-hidden text-ellipsis sticky top-0 z-10 shadow-[inset_0_-1px_0_#e5e7eb,inset_-1px_0_0_#e5e7eb] ${colClass}`} title={alt}>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            className={`w-full py-2 px-1 border border-transparent bg-transparent rounded-md text-sm transition-all box-border [&:not(:read-only)]:hover:bg-white/50 [&:not(:read-only)]:hover:border-gray-200 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-white [&:not(:read-only)]:focus:border-blue-500 [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-blue-500/20 uppercase font-bold tracking-wide text-center ${headerColor}`}
                                            value={alt} 
                                            onChange={(e) => updateAlternative(colIndex, e.target.value)} 
                                            disabled={showRanking} 
                                        />
                                        <button 
                                            className="inline-flex justify-center items-center bg-white text-gray-400 font-bold cursor-pointer transition-all border border-gray-200 w-[22px] h-[22px] rounded-full text-sm leading-none enabled:hover:border-gray-300 enabled:hover:text-gray-600 enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                            onClick={() => handleRemoveAlternative(colIndex)} 
                                            title="Usuń tę alternatywę" 
                                            disabled={showRanking}
                                        >
                                            -
                                        </button>
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {objectives.map((obj, rowIndex) => {
                        const rowRanks = getRowRanks(rowIndex, store);
                        const isLowerBetter = sortDirections[rowIndex] === 'lower';
                        
                        const isRowEqual = equalizedRowsIndexes.includes(rowIndex);
                        let trClass = "";
                        if (isRowEqual) {
                            trClass += " bg-gray-50 opacity-60";
                            if (hideEqualizedObjectives) {
                                trClass += " hidden";
                            }
                        }

                        return (
                            <tr key={`row-${rowIndex}`} className={trClass}>
                                <td className="bg-white sticky left-0 z-[11] shadow-[inset_-1px_0_0_#e5e7eb,inset_0_-1px_0_#e5e7eb] px-4 py-3 align-middle overflow-hidden text-ellipsis">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            className="inline-flex justify-center items-center bg-white text-gray-400 font-bold cursor-pointer transition-all border border-gray-200 w-[22px] h-[22px] rounded-full text-sm leading-none enabled:hover:border-gray-300 enabled:hover:text-gray-600 enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                            onClick={() => handleRemoveObjective(rowIndex)} 
                                            title="Usuń ten cel" 
                                            disabled={showRanking}
                                        >
                                            -
                                        </button>
                                        
                                        <input 
                                            className={`w-full py-2 px-1 border border-transparent bg-transparent rounded-md text-sm transition-all box-border font-medium flex-1 min-w-[100px] [&:not(:read-only)]:hover:bg-white/50 [&:not(:read-only)]:hover:border-gray-200 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-white [&:not(:read-only)]:focus:border-blue-500 [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-blue-500/20 text-gray-900 ${isRowEqual ? 'line-through !text-gray-400' : ''}`}
                                            value={obj} 
                                            onChange={(e) => updateObjective(rowIndex, e.target.value)} 
                                            disabled={showRanking} 
                                            placeholder="Nazwa celu"
                                        />
                                        
                                        <input 
                                            className={`w-[60px] py-1.5 px-1 border border-dashed border-gray-300 bg-transparent rounded text-xs transition-all box-border text-center shrink-0 [&:not(:read-only)]:hover:bg-white/50 [&:not(:read-only)]:hover:border-gray-400 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-white [&:not(:read-only)]:focus:border-blue-500 [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-blue-500/20 text-gray-600 ${isRowEqual ? 'line-through !text-gray-400' : ''}`}
                                            placeholder="np. zł"
                                            value={objectiveUnits[rowIndex] || ''}
                                            onChange={(e) => updateUnit(rowIndex, e.target.value)}
                                            disabled={showRanking}
                                            title="Dodaj jednostkę (np. zł, m², min)"
                                            list="unit-suggestions"
                                        />

                                        <button 
                                            className="shrink-0 w-[60px] flex justify-center cursor-pointer py-1.5 px-2.5 border-none rounded-md bg-green-100 text-[12px] font-semibold text-green-800 whitespace-nowrap transition-all enabled:hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 font-sans"
                                            onClick={() => toggleSortDirection(rowIndex)}
                                            title="Kliknij, aby odwrócić ranking dla tego celu"
                                            disabled={showRanking}
                                        >
                                            {isLowerBetter ? '↓ lepiej' : '↑ lepiej'}
                                        </button>
                                    </div>
                                </td>

                                {alternatives.map((_, colIndex) => {
                                    const currentVal = cells[`${rowIndex}-${colIndex}`] || '';
                                    const displayValue = showRanking 
                                        ? (rowRanks[colIndex] ? `${rowRanks[colIndex]}` : '') 
                                        : currentVal;
                                    
                                    const rankVal = rowRanks[colIndex];
                                    const allRanks = Object.values(rowRanks);
                                    const maxRank = allRanks.length > 0 ? Math.max(...allRanks) : null;
                                    
                                    const isFirst = rankVal === 1;
                                    const isLast = rankVal === maxRank && maxRank > 1;
                                    
                                    const domType = showRanking && dominationResults[colIndex] ? dominationResults[colIndex].type : null;
                                    const isRejected = rejectedAlternatives.includes(colIndex);
                                    const isWinner = winnerIndex === colIndex;

                                    let bgStyle = showRanking ? 'bg-gray-50' : 'bg-white';
                                    if (isWinner) bgStyle = 'bg-green-50';
                                    else if (domType === 'strict') bgStyle = 'bg-red-50';
                                    else if (domType === 'practical') bgStyle = 'bg-amber-50';

                                    let tdClass = "";
                                    if (isRejected && !showRejected) tdClass = "hidden";
                                    else if (isRejected && showRejected) tdClass = "opacity-40 bg-gray-50";

                                    const originalVal = originalCells[`${rowIndex}-${colIndex}`] || '';
                                    const hasChangedInTradeoff = showTradeoffs && !showRanking && originalVal !== '' && originalVal !== currentVal;

                                    const hasValidValue = cells[`${rowIndex}-${colIndex}`] !== undefined && cells[`${rowIndex}-${colIndex}`].toString().trim() !== '';
                                    const showGreenDot = !showRanking && isFirst && maxRank > 1 && hasValidValue && !isRowEqual;

                                    const inputColor = showRanking ? (isFirst ? 'text-emerald-600' : (isLast ? 'text-red-600' : 'text-gray-900')) : 'text-gray-900';
                                    const inputWeight = showRanking ? 'font-bold' : 'font-normal';

                                    return (
                                        <td key={`cell-${rowIndex}-${colIndex}`} className={`p-1.5 align-middle border-b border-r border-gray-200 overflow-hidden text-ellipsis ${bgStyle} ${tdClass}`}>
                                            <div className="relative flex flex-row items-center justify-center w-full">
                                                {hasChangedInTradeoff && (
                                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] text-red-500 line-through whitespace-nowrap pointer-events-none">{originalVal}</span>
                                                )}
                                                {showGreenDot && (
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-green-500 rounded-full z-10 shadow-[0_0_0_2px_rgba(34,197,94,0.2)] pointer-events-none" title="Najlepsza wartość w tym kryterium" />
                                                )}
                                                <input 
                                                    className={`w-full py-1.5 px-0.5 border border-transparent bg-transparent rounded-md text-sm transition-all box-border text-center [&:not(:read-only)]:hover:bg-white/50 [&:not(:read-only)]:hover:border-gray-200 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-white [&:not(:read-only)]:focus:border-blue-500 [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-blue-500/20 read-only:text-center ${inputColor} ${inputWeight} ${isRowEqual ? 'line-through !text-gray-400' : ''}`}
                                                    value={displayValue} 
                                                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)} 
                                                    placeholder={showRanking ? "-" : "wartość / ocena"}
                                                    readOnly={showRanking}
                                                    list={!showRanking ? "scale-suggestions" : undefined}
                                                    onBlur={(e) => {
                                                        if (showRanking) return; 
                                                        const val = e.target.value;
                                                        if (!val) return;
                                                        const unit = objectiveUnits[rowIndex] || '';
                                                        
                                                        let cleanStr = val.replace(/\s/g, '');
                                                        if (unit) {
                                                            cleanStr = cleanStr.split(unit.replace(/\s/g, '')).join(''); 
                                                        }
                                                        cleanStr = cleanStr.replace(',', '.');
                                                        
                                                        if (!isNaN(cleanStr) && cleanStr !== '') {
                                                            const num = Number(cleanStr);
                                                            let formatted = num.toLocaleString('pl-PL', { maximumFractionDigits: 4 });
                                                            if (unit) formatted += ` ${unit}`;
                                                            
                                                            if (formatted !== val) {
                                                                updateCell(rowIndex, colIndex, formatted);
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    
                    {showRanking && (Object.keys(dominationResults).length > 0 || winnerIndex !== null || rejectedAlternatives.length > 0 || completeAlts.length < alternatives.length) && (
                        <tr>
                            <td className="bg-white text-right text-[11px] text-gray-500 uppercase font-bold pr-5 whitespace-nowrap border-b border-r border-gray-200 py-3">
                                Wnioski z analizy Smart Choices →
                            </td>
                            {alternatives.map((_, colIndex) => {
                                const isRejected = rejectedAlternatives.includes(colIndex);
                                const isWinner = winnerIndex === colIndex;
                                const isComplete = completeAlts.includes(colIndex);
                                const dom = dominationResults[colIndex];
                                
                                if (isRejected) {
                                    return (
                                        <td key={`dom-${colIndex}`} className={`p-1.5 align-middle border-b border-r border-gray-200 text-center bg-gray-50 ${!showRejected ? 'hidden' : 'opacity-40'}`}>
                                            <button 
                                                onClick={() => restoreAlternative(colIndex)} 
                                                className="bg-white border border-gray-400 rounded-full px-3 py-1 text-xs font-medium text-gray-600 cursor-pointer transition-all hover:bg-gray-100 hover:text-gray-900 font-sans"
                                            >
                                                Przywróć opcję
                                            </button>
                                        </td>
                                    );
                                }

                                if (!isComplete) {
                                    return (
                                        <td key={`dom-${colIndex}`} className="p-3 align-middle border-b border-r border-gray-200 text-center bg-gray-100 text-[11px] text-gray-400">
                                            <span className="font-semibold block mb-1">NIEKOMPLETNA</span>
                                            Wypełnij puste pola, aby opcja wzięła udział w walce o wygraną.
                                        </td>
                                    );
                                }

                                if (isWinner) {
                                    return (
                                        <td key={`dom-${colIndex}`} className="p-1.5 align-middle border-b border-r border-gray-200 bg-green-50 text-green-700 text-[11px] font-medium leading-relaxed text-center">
                                            <span className="text-sm block mb-1 font-bold">🏆 ZWYCIĘZCA</span>
                                            To Twoja optymalna decyzja!
                                        </td>
                                    );
                                }

                                if (!dom) return <td key={`dom-${colIndex}`} className="p-1.5 align-middle border-b border-r border-gray-200 bg-gray-50"></td>;

                                if (dom.type === 'strict') {
                                    return (
                                        <td key={`dom-${colIndex}`} className="p-3 align-middle border-b border-r border-gray-200 bg-red-50 text-red-700 text-[11px] font-medium leading-relaxed text-center">
                                            <span className="text-xs block mb-1.5 font-bold uppercase tracking-wide">Zdominowana</span>
                                            <span className="block mb-2.5">
                                                Przegrała z <strong className="font-bold">{dom.by}</strong>.<br/>
                                                Możesz ją bezpiecznie odrzucić.
                                            </span>
                                            <button 
                                                className="block mx-auto px-3 py-2 text-[11px] font-semibold bg-red-500 text-white border-none rounded-md cursor-pointer w-full transition-colors hover:bg-red-600 font-sans"
                                                onClick={() => rejectAlternative(colIndex)} 
                                            >
                                                Odrzuć opcję
                                            </button>
                                        </td>
                                    );
                                } else {
                                    return (
                                        <td key={`dom-${colIndex}`} className="p-3 align-middle border-b border-r border-gray-200 bg-amber-50 text-amber-600 text-[11px] font-medium leading-relaxed text-center">
                                            <span className="text-xs block mb-1.5 font-bold uppercase tracking-wide">Rozważ odrzucenie</span>
                                            <span className="block mb-2.5">
                                                Opcja <strong className="font-bold">{dom.by}</strong> jest gorsza tylko w <strong className="font-bold">"{dom.objective}"</strong>.<br/><br/>
                                                Zastanów się, jak ważne jest to kryterium?
                                            </span>
                                            <button 
                                                className="block mx-auto px-3 py-1.5 text-[11px] font-semibold bg-transparent text-amber-600 border border-amber-500 rounded-md cursor-pointer w-full transition-all hover:bg-amber-100 hover:text-amber-700 font-sans"
                                                onClick={() => rejectAlternative(colIndex)} 
                                            >
                                                Odrzuć opcję
                                            </button>
                                        </td>
                                    );
                                }
                            })}
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="mt-3 flex justify-between items-center">
                <div></div>
                <div className="flex gap-3">
                    {equalizedCount > 0 && (
                        <button className="bg-transparent border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer inline-flex items-center gap-2 text-[13px] font-medium text-gray-400 transition-all font-sans hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300" onClick={toggleHideEqualized}>
                            {hideEqualizedObjectives ? <IconEye /> : <IconEyeOff />}
                            {hideEqualizedObjectives ? `Pokaż wyrównane cele (${equalizedCount})` : `Ukryj wyrównane cele (${equalizedCount})`}
                        </button>
                    )}
                    
                    {rejectedAlternatives.length > 0 && (
                        <button className="bg-transparent border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer inline-flex items-center gap-2 text-[13px] font-medium text-gray-400 transition-all font-sans hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300" onClick={toggleShowRejected}>
                            {showRejected ? <IconEyeOff /> : <IconEye />}
                            {showRejected ? `Ukryj odrzucone opcje (${rejectedAlternatives.length})` : `Pokaż odrzucone opcje (${rejectedAlternatives.length})`}
                        </button>
                    )}
                </div>
            </div>
            
            <datalist id="scale-suggestions">
                {store.customScales.map((scale, index) => (
                    <option key={index} value={scale.word} />
                ))}
            </datalist>

            <datalist id="unit-suggestions">
                <option value="zł" /><option value="$" /><option value="€" /><option value="m²" /><option value="m" /><option value="km" /><option value="kg" /><option value="min" /><option value="h" /><option value="%" /><option value="szt." />
            </datalist>
        </div>
    );
}