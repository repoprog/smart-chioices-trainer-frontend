import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Edit2, Trash2, Calendar, MessageSquare, X, Tag, 
  FolderPlus, Network, Table2, Play, Filter 
} from "lucide-react";

import { decisionApi } from "../api/decisionApi";
import { useTreeStore } from "../features/DecisionTree/store/useTreeStore";
import { useTableStore } from "../features/DecisionTable/store/useTableStore";

import { Button } from "../components/ui/Button"; 
import { Input } from "../components/ui/Input";   
import { Badge } from "../components/ui/Badge";   
import { Card } from "../components/ui/Card";
import { ConfirmModal } from "../components/ui/ConfirmModal";     

export default function UserPanel() {
  const navigate = useNavigate();

  // --- STANY APLIKACJI ---
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtry
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Edycja
  const [editingId, setEditingId] = useState(null);
  const [editedNotes, setEditedNotes] = useState("");
  const [editingTags, setEditingTags] = useState(null);
  const [newTagInput, setNewTagInput] = useState("");

  // Modale
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, projectId: null });
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ title: '', type: 'TREE' });
  const [isCreating, setIsCreating] = useState(false);

  // --- POBIERANIE DANYCH ---
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await decisionApi.getUserProjects();
      setProjects(data);
    } catch (error) {
      console.error("Błąd podczas pobierania projektów:", error);
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
      // Filtr wyszukiwania
      const matchesSearch = 
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtr typu i statusu
      const matchesType = filterType === "ALL" || p.type === filterType;
      const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
      
      // Filtr tagów
      const pTags = p.tags || [];
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => pTags.includes(tag));
      
      return matchesSearch && matchesType && matchesStatus && matchesTags;
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [projects, searchQuery, filterType, filterStatus, selectedTags]);

  // --- AKCJE ---
  const startEditing = (project) => {
    setEditingId(project.id);
    setEditedNotes(project.notes || "");
    setEditingTags(project.tags || []);
  };

  const saveNotesAndTags = async (id) => {
    try {
      // API zakłada updateProjectMeta dla tagów i notatek
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
    } catch (error) {
      console.error("Błąd zapisu:", error);
    } finally {
      setEditingId(null);
      setEditingTags(null);
    }
  };

  const confirmDelete = async () => {
    try {
      await decisionApi.deleteProject(deleteModal.projectId);
      setProjects(projects.filter((p) => p.id !== deleteModal.projectId));
    } catch (error) {
      console.error("Błąd usuwania:", error);
    } finally {
      setDeleteModal({ isOpen: false, projectId: null });
    }
  };

  const openProject = async (project) => {
    if (project.type === 'TREE') {
      await useTreeStore.getState().loadCloudProject(project.id);
      navigate('/app/tree');
    } else {
      await useTableStore.getState().loadCloudProject(project.id);
      navigate('/app/table');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectForm.title.trim()) return;
    
    setIsCreating(true);
    try {
      const res = await decisionApi.createProject(newProjectForm.title, newProjectForm.type);
      
      if (newProjectForm.type === 'TREE') {
        useTreeStore.getState().resetTree();
        useTreeStore.getState().setCurrentProject(res.id);
        navigate('/app/tree');
      } else {
        useTableStore.getState().resetAll();
        useTableStore.getState().setCurrentProject(res.id);
        navigate('/app/table');
      }
    } catch (error) {
      console.error("Błąd tworzenia projektu:", error);
    } finally {
      setIsCreating(false);
      setNewProjectModal(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Panel użytkownika</h2>
          <p className="text-muted-foreground mt-1">Przeglądaj i zarządzaj swoimi decyzjami</p>
        </div>
        <Button onClick={() => setNewProjectModal(true)} className="shrink-0">
          <FolderPlus className="w-4 h-4 mr-2" />
          Nowy projekt
        </Button>
      </div>

      {/* FILTRY */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input 
            icon={Search}
            placeholder="Szukaj decyzji po tytule lub notatkach..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="ALL">Wszystkie typy</option>
            <option value="TREE">Drzewo decyzyjne</option>
            <option value="TABLE">Tabela Smart Choices</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors cursor-pointer"
          >
            <option value="ALL">Wszystkie statusy</option>
            <option value="DRAFT">Draft</option>
            <option value="FINALIZED">Zakończone</option>
          </select>
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
                variant={selectedTags.includes(tag) ? "default" : "outline"} // Dostosuj do swoich wariantów Badge
                className="cursor-pointer hover:bg-primary/10 transition-colors"
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
          Pobieranie projektów...
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
                    <Badge variant={project.type === "TABLE" ? "success" : "primary"}>
                      {project.type === "TABLE" ? "Tabela" : "Drzewo"}
                    </Badge>
                    {project.status === 'DRAFT' && <Badge variant="outline">Draft</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(project.updatedAt || project.createdAt).toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <Button variant="outline" size="sm" onClick={() => openProject(project)}>
                    <Play className="w-4 h-4 mr-2" /> Otwórz
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => startEditing(project)} title="Edytuj meta">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="dangerGhost" size="icon" onClick={() => setDeleteModal({ isOpen: true, projectId: project.id })} title="Usuń">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* TAGI */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Tag className="w-4 h-4" />
                  Tagi
                </div>
                
                {editingId === project.id && editingTags ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {editingTags.map((tag) => (
                      <Badge key={tag} className="pr-1">
                        {tag}
                        <button onClick={() => setEditingTags(editingTags.filter((t) => t !== tag))} className="hover:bg-primary/20 rounded-full p-0.5 ml-1 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <div className="flex items-center gap-1 ml-2">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTagToEditing()}
                        placeholder="Dodaj tag..."
                        className="px-3 py-1 bg-background border border-border rounded-full text-sm outline-none focus:border-primary transition-colors w-32"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {project.tags && project.tags.length > 0 ? (
                      project.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)
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
        title="Usuwanie projektu"
        message="Czy na pewno chcesz usunąć ten projekt? Ta operacja jest nieodwracalna."
        variant="danger"
        confirmText="Usuń projekt"
      />

      {/* MODAL NOWEGO PROJEKTU */}
      {newProjectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 shadow-xl border-border animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-semibold mb-4">Utwórz nowy projekt</h2>
            <form onSubmit={handleCreateProject} className="space-y-5">
              <Input
                label="Nazwa projektu"
                placeholder="Np. Wybór samochodu..."
                value={newProjectForm.title}
                onChange={(e) => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                required
                autoFocus
              />
              
              <div>
                <label className="block text-sm font-medium mb-3">Narzędzie analityczne</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setNewProjectForm({ ...newProjectForm, type: 'TREE' })}
                    className={`p-4 border rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${newProjectForm.type === 'TREE' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted'}`}
                  >
                    <Network className={`w-8 h-8 ${newProjectForm.type === 'TREE' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium text-center mt-1">Drzewo decyzyjne</span>
                  </div>
                  <div 
                    onClick={() => setNewProjectForm({ ...newProjectForm, type: 'TABLE' })}
                    className={`p-4 border rounded-xl cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${newProjectForm.type === 'TABLE' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted'}`}
                  >
                    <Table2 className={`w-8 h-8 ${newProjectForm.type === 'TABLE' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium text-center mt-1">Tabela Smart Choices</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button type="button" variant="ghost" onClick={() => setNewProjectModal(false)}>Anuluj</Button>
                <Button type="submit" disabled={isCreating || !newProjectForm.title.trim()}>
                  {isCreating ? 'Tworzenie...' : 'Utwórz projekt'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}