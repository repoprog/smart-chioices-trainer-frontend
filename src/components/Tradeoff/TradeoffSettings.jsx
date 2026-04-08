import { useState } from 'react';
import { useTradeoffStore } from '../../store/useTradeOffStore';
import { Settings2, ChevronDown, ChevronUp, X, Plus, Trash2 } from 'lucide-react';

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
        <div className="mt-8 border-t border-border pt-6">
            
            {/* Przycisk otwierający ustawienia */}
            <button 
                onClick={() => setShowScalesSettings(!showScalesSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors text-sm font-medium"
            >
                <Settings2 className="w-4 h-4 text-muted-foreground" />
                Ustawienia ocen tekstowych
                {showScalesSettings ? (
                    <ChevronUp className="w-4 h-4 ml-1 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                )}
            </button>
            
            {showScalesSettings && (
                <div className="mt-4 p-5 bg-card border border-border rounded-xl shadow-sm space-y-6 max-w-[800px] animate-in fade-in slide-in-from-top-2">
                    
                    {/* SEKCJ 1: Pakiety */}
                    <div>
                        <h3 className="text-sm font-medium text-foreground mb-3">Gotowe pakiety ocen</h3>
                        <div className="flex flex-wrap items-center gap-2">
                            {PRESET_KEYS.map(presetKey => (
                                <button 
                                    key={presetKey} 
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                                        activePreset === presetKey 
                                            ? 'bg-primary text-primary-foreground' 
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`} 
                                    onClick={() => handleLoadPreset(presetKey)}
                                >
                                    {presetKey}
                                </button>
                            ))}
                            
                            <div className="w-px h-5 bg-border mx-1"></div> {/* Separator */}

                            <button 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-colors text-destructive hover:bg-destructive/10" 
                                onClick={() => { 
                                    if(window.confirm("Wyczyścić wszystkie oceny?")) {
                                        clearScales();
                                    }
                                }}
                            >
                                <Trash2 className="w-3 h-3" />
                                Wyczyść listę
                            </button>
                        </div>
                    </div>

                    {/* SEKCJA 2: Aktywne Tagi Ocen */}
                    <div>
                        <h3 className="text-sm font-medium text-foreground mb-3">Twoje aktywne oceny</h3>
                        {customScales.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {customScales.map((scale, index) => (
                                    <span 
                                        key={index} 
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium shadow-sm transition-all"
                                    >
                                        <span>
                                            {scale.word} 
                                            <span className="opacity-50 ml-1 font-normal tracking-tight">→ {scale.rank}</span>
                                        </span>
                                        <button 
                                            className="hover:bg-primary/20 rounded-full p-0.5 ml-0.5 transition-colors focus:outline-none" 
                                            onClick={() => removeScale(index)} 
                                            title="Usuń"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">Brak aktywnych ocen tekstowych. Dodaj je poniżej lub wybierz pakiet.</p>
                        )}
                    </div>

                    {/* SEKCJA 3: Dodawanie nowej (w stylu Tagów) */}
                    <div className="pt-5 border-t border-border border-dashed">
                        <div className="flex items-end gap-3 flex-wrap sm:flex-nowrap">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Nazwa oceny</label>
                                <input 
                                    className="w-full px-4 py-2 bg-background border border-border rounded-full text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                    placeholder="np. premium" 
                                    value={newScaleWord}
                                    onChange={(e) => setNewScaleWord(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddScale()}
                                />
                            </div>
                            <div className="w-[120px]">
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">Waga (punkty)</label>
                                <input 
                                    className="w-full px-4 py-2 bg-background border border-border rounded-full text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                    placeholder="np. 5" 
                                    type="number"
                                    value={newScaleRank}
                                    onChange={(e) => setNewScaleRank(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddScale()}
                                />
                            </div>
                            <button 
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm mb-px" 
                                onClick={handleAddScale}
                            >
                                <Plus className="w-4 h-4" />
                                Dodaj
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}