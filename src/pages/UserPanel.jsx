import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Edit2, Trash2, Calendar, MessageSquare, X, Tag, 
  ExternalLink, Filter, Plus, Camera
} from "lucide-react";

import { decisionApi } from "../api/decisionApi";
import { useTreeStore } from "../features/DecisionTree/store/useTreeStore";
import { useTableStore } from "../features/DecisionTable/store/useTableStore";
import { useToastStore } from "../store/useToastStore";

import { Button } from "../components/ui/Button"; 
import { Badge } from "../components/ui/Badge";   
import { Card } from "../components/ui/Card";
import { ConfirmModal } from "../components/modals/ConfirmModal";     

export default function UserPanel() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);

  // --- STANY APLIKACJI ---
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtry (Zmienione na zgodne z Figmą)
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); 
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Edycja
  const [editingId, setEditingId] = useState(null);
  const [editedNotes, setEditedNotes] = useState("");
  const [editingTags, setEditingTags] = useState(null);
  const [newTagInput, setNewTagInput] = useState("");

  // Modale
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, projectId: null });

  // --- POBIERANIE DANYCH ---
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await decisionApi.getUserProjects();
      setProjects(data);
    } catch (error) {
      console.error("Błąd pobierania:", error);
      addToast("Nie udało się pobrać decyzji z serwera.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --- LOGIKA FILTROWANIA ---
  const allTags = Array.from(new Set(projects.flatMap((d) => d.tags || [])));

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = 
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === "ALL" || p.type === typeFilter;
      
      const pTags = p.tags || [];
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => pTags.includes(tag));
      
      return matchesSearch && matchesType && matchesTags;
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [projects, searchQuery, typeFilter, selectedTags]);

  // --- AKCJE ---
  const startEditing = (project) => {
    setEditingId(project.id);
    setEditedNotes(project.notes || "");
    setEditingTags(project.tags || []);
  };

  const saveNotesAndTags = async (id) => {
    try {
      const projectToUpdate = projects.find(p => p.id === id);
      await decisionApi.updateProjectMeta(id, {
        title: projectToUpdate.title,
        status: projectToUpdate.status,
        category: projectToUpdate.category,
        tags: editingTags,
        notes: editedNotes
      });
      
      setProjects(projects.map((p) => 
        p.id === id ? { ...p, notes: editedNotes, tags: editingTags } : p
      ));
      addToast("Zmiany zostały zapisane.", "success"); 
    } catch (error) {
      addToast("Błąd podczas zapisywania zmian.", "error"); 
    } finally {
      setEditingId(null);
      setEditingTags(null);
    }
  };

  const confirmDelete = async () => {
    try {
      await decisionApi.deleteProject(deleteModal.projectId);
      setProjects(projects.filter((p) => p.id !== deleteModal.projectId));
      addToast("Decyzja została usunięta.", "success"); 
    } catch (error) {
      addToast("Nie udało się usunąć decyzji.", "error"); 
    } finally {
      setDeleteModal({ isOpen: false, projectId: null });
    }
  };

  const openProject = async (project) => {
    try {
      if (project.type === 'TREE') {
        useTreeStore.getState().exitPreviewMode();
        await useTreeStore.getState().loadCloudProject(project.id);
        navigate('/app/tree');
      } else {
        useTableStore.getState().exitPreviewMode();
        await useTableStore.getState().loadCloudProject(project.id);
        navigate('/app/table');
      }
    } catch (error) {
      addToast("Nie udało się otworzyć decyzji.", "error"); 
    }
  };

  // --- TAGI UI ---
  const toggleTagFilter = (tag) => {
    setSelectedTags(selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]);
  };

  const addTagToEditing = () => {
    if (newTagInput.trim() && editingTags && !editingTags.includes(newTagInput.trim())) {
      setEditingTags([...editingTags, newTagInput.trim()]);
      setNewTagInput("");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Panel użytkownika</h2>
          <p className="text-muted-foreground mt-1">Przeglądaj i zarządzaj swoimi decyzjami</p>
        </div>
      </div>

      {/* Pasek wyszukiwania i ZAKŁADKI (Wizualnie z Figmy) */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Szukaj decyzji po tytule lub notatkach..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary transition-colors text-sm"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              typeFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Wszystko
          </button>
          <button
            onClick={() => setTypeFilter("TABLE")}
            className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              typeFilter === "TABLE"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Tabela
          </button>
          <button
            onClick={() => setTypeFilter("TREE")}
            className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              typeFilter === "TREE"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Drzewo
          </button>
        </div>
      </div>

      {/* FILTRY TAGÓW */}
      {allTags.length > 0 && (
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Filtruj według tagów</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "active" : "interactive"} 
                onClick={() => toggleTagFilter(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <button onClick={() => setSelectedTags([])} className="text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors underline">
              Wyczyść filtry tagów
            </button>
          )}
        </Card>
      )}

      {/* LISTA DECYZJI */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          Pobieranie decyzji...
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center py-16 bg-muted/10 border-dashed border-2 shadow-none">
          <Filter className="w-8 h-8 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground m-0">Nie znaleziono decyzji pasujących do zapytania.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:border-primary/50 transition-colors group">
              <div className="flex flex-col md:flex-row items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{project.title}</h3>
                    
                  {/* CUSTOMOWE KOLORY BADGY DLA TABELI I DRZEWA */}
                    {project.type === "TABLE" ? (
                      <Badge variant="table">Tabela</Badge>
                    ) : (
                      <Badge variant="tree">Drzewo</Badge>
                    )}

                   
                    {/* NOWY BADGE - SNAPSHOTY */}
                    {project.snapshotCount !== undefined && (
                      <Badge 
                        variant="secondary" 
                        title={`Liczba zapisanych wersji: ${project.snapshotCount}`}
                        className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs text-muted-foreground bg-muted/40 border-border/50 cursor-help"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{project.snapshotCount}</span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(project.updatedAt || project.createdAt).toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                </div>
                
                {/* AKCJE */}
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <Button variant="ghost" size="icon" onClick={() => openProject(project)} title="Otwórz w module" className="text-primary hover:bg-primary/10">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => startEditing(project)} title="Edytuj meta" className="text-primary hover:bg-primary/10">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="dangerGhost" size="icon" onClick={() => setDeleteModal({ isOpen: true, projectId: project.id })} title="Usuń decyzję" >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* TAGI W KARTACH */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Tag className="w-4 h-4" />
                  Tagi
                </div>
                
                {editingId === project.id && editingTags ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {editingTags.map((tag) => (
                      <Badge key={tag} variant="primary" className="pr-1">
                        {tag}
                        <button 
                          onClick={() => setEditingTags(editingTags.filter((t) => t !== tag))} 
                          className="hover:bg-primary/20 rounded-full p-0.5 ml-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    
                    {/* INPUT DLA NOWEGO TAGU Z IDEALNIE OKRĄGŁYM PLUSEM */}
                    <div className="flex items-center gap-1.5 ml-2">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTagToEditing()}
                        placeholder="Dodaj tag..."
                        className="px-3 py-1.5 bg-background border border-border rounded-full text-sm outline-none focus:border-primary transition-colors w-32"
                      />
                      <button
                        onClick={addTagToEditing}
                        className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shrink-0"
                        title="Dodaj"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {project.tags && project.tags.length > 0 ? (
                      project.tags.map((tag) => (
                        <Badge key={tag} variant="default">{tag}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Brak tagów</span>
                    )}
                  </div>
                )}
              </div>

              {/* NOTATKI */}
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Notatki
                </div>
                {editingId === project.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
                      rows={3}
                      placeholder="Dodaj przemyślenia dotyczące tej decyzji..."
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => saveNotesAndTags(project.id)}>Zapisz zmiany</Button>
                      <Button variant="secondary" onClick={() => { setEditingId(null); setEditingTags(null); setNewTagInput(""); }}>Anuluj</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground leading-relaxed bg-muted/20 p-4 rounded-lg text-sm">
                    {project.notes || <span className="italic text-muted-foreground opacity-70">Brak notatek. Kliknij ikonę ołówka, aby dodać.</span>}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL USUWANIA */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, projectId: null })}
        onConfirm={confirmDelete}
        title="Usuwanie decyzji"
        message="Czy na pewno chcesz usunąć tę decyzję? Ta operacja jest nieodwracalna."
        variant="danger"
        confirmText="Usuń decyzję"
      />
    </div>
  );
}