import React from 'react';
import { X, Save } from 'lucide-react';

export function SaveDecisionModal({ 
  isOpen, 
  onClose, 
  title, 
  placeholder, 
  newProjectData, 
  setNewProjectData, 
  handleCreateProject, 
  isSaving 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md p-6 rounded-xl shadow-xl border border-border animate-in fade-in zoom-in-95 relative">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-5">{title}</h2>
        
        <form onSubmit={handleCreateProject} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nazwa decyzji <span className="text-destructive">*</span>
            </label>
            <input 
              autoFocus required
              value={newProjectData.title} 
              onChange={e => setNewProjectData({...newProjectData, title: e.target.value})} 
              placeholder={placeholder}
              className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary transition-colors" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Notatki <span className="text-muted-foreground text-xs">(opcjonalne)</span>
            </label>
            <textarea 
              value={newProjectData.notes} 
              onChange={e => setNewProjectData({...newProjectData, notes: e.target.value})} 
              placeholder="Dodaj kontekst, powody wyboru lub inne istotne informacje..."
              className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary transition-colors resize-none" 
              rows={4}
            />
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
              disabled={isSaving || !newProjectData.title.trim()} 
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Zapisywanie...' : 'Zapisz decyzję'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}