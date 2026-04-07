import { useState } from 'react';
import { useTradeoffStore } from '../../store/useTradeOffStore';


// Lista nazw pakietów, żebyśmy mogli wygenerować przyciski (sama logika jest w store)
const PRESET_KEYS = [
    'Jakość / Standard', 
    'Priorytet', 
    'Szkolny (1-6)', 
    'Klasa energetyczna', 
    'Tak / Nie'
];

export function TradeoffSettings() {
    const [showScalesSettings, setShowScalesSettings] = useState(false);
    const [newScaleWord, setNewScaleWord] = useState('');
    const [newScaleRank, setNewScaleRank] = useState('');

    const {
        customScales,
        activePreset,
        loadPreset,
        addScale,
        removeScale,
        clearScales
    } = useTradeoffStore();

    const handleLoadPreset = (presetKey) => {
        if (customScales.length > 0 && activePreset !== presetKey) {
            const confirm = window.confirm(`Czy chcesz zastąpić obecną listę pakietem "${presetKey}"?`);
            if (!confirm) return;
        }
        loadPreset(presetKey);
    };

    const handleAddScale = () => {
        if (newScaleWord.trim() !== '' && newScaleRank.trim() !== '') {
            addScale(newScaleWord.trim(), newScaleRank.trim());
            setNewScaleWord('');
            setNewScaleRank('');
        }
    };

    return (
        <div className="mt-8 border-t border-gray-200 pt-5 flex justify-between items-start">
            <div className="w-full max-w-[600px]">
                <button 
                    onClick={() => setShowScalesSettings(!showScalesSettings)}
                    className="bg-transparent border border-gray-200 rounded-lg px-4 py-2.5 cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition-all font-sans hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Ustawienia ocen
                    <span className={`text-[10px] ml-1 transition-transform duration-200 ${showScalesSettings ? 'rotate-180' : 'rotate-0'}`}>▼</span>
                </button>
                
                {showScalesSettings && (
                    <div className="mt-4 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="mb-6">
                            <span className="text-xs font-semibold text-gray-600 block mb-2">Gotowe pakiety ocen:</span>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_KEYS.map(presetKey => (
                                    <button 
                                        key={presetKey} 
                                        className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-all border font-sans ${activePreset === presetKey ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100 hover:text-gray-900'}`} 
                                        onClick={() => handleLoadPreset(presetKey)}
                                    >
                                        {presetKey}
                                    </button>
                                ))}
                                
                                <button 
                                    className="px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-all border border-gray-200 bg-transparent text-gray-400 font-sans hover:bg-red-50 hover:text-red-500 hover:border-red-300" 
                                    onClick={() => { 
                                        if(window.confirm("Wyczyścić wszystkie oceny?")) {
                                            clearScales();
                                        }
                                    }}
                                >
                                    Wyczyść listę
                                </button>
                            </div>
                        </div>

                        {customScales.length > 0 ? (
                            <div className="mb-6">
                                <ul className="list-none p-0 m-0 flex flex-wrap gap-1.5">
                                    {customScales.map((scale, index) => (
                                        <li key={index} className="inline-flex items-stretch bg-white border border-gray-300 rounded text-[11px] text-gray-700 overflow-hidden shadow-sm transition-colors hover:border-gray-400">
                                            <div className="px-2 py-1 flex items-center gap-1">
                                                <strong className="font-bold">{scale.word}</strong> 
                                                <span className="text-gray-400">→</span> 
                                                {scale.rank}
                                                {scale.isAdded && <span className="inline-block ml-1 px-1 py-0.5 bg-blue-100 text-blue-700 rounded-sm text-[8px] font-bold uppercase tracking-wider">dodane</span>}
                                            </div>
                                            <button className="flex items-center justify-center px-2 bg-transparent border-none border-l border-gray-200 text-gray-400 text-sm cursor-pointer transition-colors hover:bg-red-50 hover:text-red-500" onClick={() => removeScale(index)} title="Usuń">
                                                &times;
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="mb-6 text-[13px] text-gray-500 italic">
                                Brak aktywnych ocen tekstowych.
                            </div>
                        )}

                        <div className="flex gap-4 items-end mt-6 pt-5 border-t border-dashed border-gray-200">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600">Dodaj własną ocenę tekstową</label>
                                <input 
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-sans bg-gray-50 text-gray-900 transition-all focus:outline-none focus:bg-white focus:border-gray-900 focus:ring-[3px] focus:ring-gray-900/10"
                                    placeholder="np. premium" 
                                    value={newScaleWord}
                                    onChange={(e) => setNewScaleWord(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600">Waga w rankingu</label>
                                <input 
                                    className="w-[150px] px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-sans bg-gray-50 text-gray-900 transition-all focus:outline-none focus:bg-white focus:border-gray-900 focus:ring-[3px] focus:ring-gray-900/10"
                                    placeholder="np. 4" 
                                    type="number"
                                    value={newScaleRank}
                                    onChange={(e) => setNewScaleRank(e.target.value)}
                                />
                            </div>
                            <button className="px-5 py-2.5 cursor-pointer font-semibold font-sans text-sm bg-gray-900 text-white border-none rounded-lg h-[41px] transition-colors flex items-center justify-center hover:bg-gray-700" onClick={handleAddScale}>
                                Dodaj
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}