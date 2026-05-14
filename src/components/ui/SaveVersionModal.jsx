import React from 'react';
import { X, Camera } from 'lucide-react';

export function SaveVersionModal({
  isOpen,
  onClose,
  snapshotLabel,
  setSnapshotLabel,
  handleCreateSnapshot,
  isSaving
}) {
  if (!isOpen) return null;

  const handleGenerateAutoName = (e) => {
    e.preventDefault();
    const now = new Date();
    const date = now.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
    const time = now.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    setSnapshotLabel(`Wersja z ${date} ${time}`);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md p-6 rounded-xl shadow-xl border border-border animate-in fade-in zoom-in-95 relative">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-5">Zapisz wersję (snapshot)</h2>
        
        <form onSubmit={handleCreateSnapshot} className="space-y-5">
          <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Camera className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">Tworzysz snapshot</p>
              <p className="text-muted-foreground">
                Ta wersja zostanie zapisana w historii i będziesz mógł do niej wrócić w dowolnym momencie.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Nazwa wersji <span className="text-destructive">*</span>
            </label>
            <input 
              autoFocus required 
              value={snapshotLabel} 
              onChange={e => setSnapshotLabel(e.target.value)} 
              placeholder="np. Przed zmianami w Q2"
              className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary transition-colors" 
            />
            <button 
              type="button" 
              onClick={handleGenerateAutoName} 
              className="text-sm text-primary hover:underline mt-2 text-left"
            >
              Wygeneruj automatyczną nazwę
            </button>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors font-medium text-sm"
            >
              Anuluj
            </button>
            <button 
              type="submit" 
              disabled={isSaving || !snapshotLabel.trim()} 
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              {isSaving ? 'Zapisywanie...' : 'Zapisz snapshot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}