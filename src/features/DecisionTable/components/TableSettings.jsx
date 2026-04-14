import { useState } from 'react';
import { useTableStore } from '../store/useTableStore';
import { Settings2, ChevronDown, ChevronUp, X, Plus, Trash2 } from 'lucide-react';
import { scalePresets } from '../data/scalePresets';

import { ConfirmModal } from '../../../components/ui/ConfirmModal'; 
import { Button } from '../../../components/ui/Button';

export function TableSettings() {
    const presetKeys = Object.keys(scalePresets);
    const [showScalesSettings, setShowScalesSettings] = useState(false);
    const [newScaleWord, setNewScaleWord] = useState('');
    const [newScaleRank, setNewScaleRank] = useState('');
    
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    const {
        customScales,
        activePreset,
        loadPreset,
        addScale,
        removeScale,
        clearScales
    } = useTableStore();

    const handleLoadPreset = (presetKey) => {
        loadPreset(presetKey);
    };

    const handleAddScale = () => {
        if (newScaleWord.trim() !== '' && newScaleRank.trim() !== '') {
            addScale(newScaleWord.trim(), newScaleRank.trim());
            setNewScaleWord('');
            setNewScaleRank('');
        }
    };

    const executeClearScales = () => {
        clearScales();
        setIsClearModalOpen(false);
    };

    return (
        <div className="mt-8 border-t border-border pt-6 relative">
            
            <Button 
                variant="secondary"
                onClick={() => setShowScalesSettings(!showScalesSettings)}
            >
                <Settings2 className="w-4 h-4 mr-2 text-muted-foreground" />
                Ustawienia ocen
                {showScalesSettings ? (
                    <ChevronUp className="w-4 h-4 ml-1 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                )}
            </Button>
            
            {showScalesSettings && (
                <div className="mt-4 p-5 bg-card border border-border rounded-xl shadow-sm space-y-6 max-w-[1000px] animate-in fade-in slide-in-from-top-2">
                    
            
                    <div>
                        <h3 className="text-sm font-medium text-foreground mb-3">Gotowe oceny</h3>
                        <div className="flex flex-wrap items-center gap-2">
                            {presetKeys.map(presetKey => (
                                <button 
                                    key={presetKey} 
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                                        activePreset === presetKey 
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent"
                                    }`}
                                    onClick={() => handleLoadPreset(presetKey)}
                                >
                                    {presetKey}
                                </button>
                            ))}
                            
                            <div className="w-px h-5 bg-border mx-1"></div>

                            <Button 
                                variant="dangerGhost"
                                size="sm"
                                className="rounded-full h-7 px-3 text-xs"
                                onClick={() => setIsClearModalOpen(true)}
                            >
                                <Trash2 className="w-3 h-3 mr-1.5" />
                                Wyczyść listę
                            </Button>
                        </div>
                    </div>

                
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
                            
                            <Button 
                                className="rounded-full mb-px"
                                onClick={handleAddScale}
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Dodaj
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isClearModalOpen}
                onClose={() => setIsClearModalOpen(false)}
                onConfirm={executeClearScales}
                title="Czyszczenie listy ocen"
                message="Czy na pewno chcesz wyczyścić listę słów dla tej oceny? Własne oceny zostaną bezpowrotnie usunięte."
                variant="danger"
                confirmText="Wyczyść"
            />
        </div>
    );
}