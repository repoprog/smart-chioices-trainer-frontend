import { useState } from "react";
import { Search, Edit2, Trash2, Calendar, MessageSquare, X, Plus, Tag } from "lucide-react";
import { Button } from "../components/ui/Button"; 
import { Input } from "../components/ui/Input";   
import { Badge } from "../components/ui/Badge";   
import { Card } from "../components/ui/Card";     

export default function UserPanel() {
  const [decisions, setDecisions] = useState([
    {
      id: "1",
      title: "Wybór dostawcy IT",
      type: "table",
      date: "2026-04-05",
      result: "Opcja B - najlepszy wynik: 156 punktów",
      notes: "Wybrany dostawca oferuje najlepszy stosunek jakości do ceny. Warto rozważyć renegocjację warunków SLA.",
      tags: ["biznes", "IT", "dostawcy"],
    },
    {
      id: "2",
      title: "Inwestycja w nowy projekt",
      type: "tree",
      date: "2026-04-02",
      result: "Zaakceptuj projekt",
      notes: "ROI przekracza 25%, ryzyko jest akceptowalne. Rozpoczęcie planowane na Q2 2026.",
      tags: ["projekt", "inwestycje", "finanse"],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedNotes, setEditedNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [editingTags, setEditingTags] = useState(null);
  const [newTagInput, setNewTagInput] = useState("");

  const allTags = Array.from(new Set(decisions.flatMap((d) => d.tags)));

  const filteredDecisions = decisions.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => d.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const startEditing = (decision) => {
    setEditingId(decision.id);
    setEditedNotes(decision.notes);
    setEditingTags(decision.tags);
  };

  const saveNotes = (id) => {
    setDecisions(decisions.map((d) => d.id === id ? { ...d, notes: editedNotes, tags: editingTags || d.tags } : d));
    setEditingId(null);
    setEditingTags(null);
  };

  const deleteDecision = (id) => setDecisions(decisions.filter((d) => d.id !== id));

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Panel użytkownika</h2>
        <p className="text-muted-foreground mt-1">Przeglądaj i zarządzaj swoimi decyzjami</p>
      </div>

      {/* REFACTOR: Wyszukiwarka używa nowego komponentu Input */}
      <Input 
        icon={Search}
        placeholder="Szukaj decyzji po tytule lub notatkach..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* REFACTOR: Karta filtrów używa Card i Badge */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium">Filtruj według tagów</h3>
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
          <button onClick={() => setSelectedTags([])} className="text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors">
            Wyczyść filtry
          </button>
        )}
      </Card>

      {/* REFACTOR: Lista decyzji używa Card */}
      <div className="space-y-4">
        {filteredDecisions.map((decision) => (
          <Card key={decision.id} className="hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{decision.title}</h3>
                  <Badge variant="default">
                    {decision.type === "table" ? "Tabela" : "Drzewo"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(decision.date).toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => startEditing(decision)} title="Edytuj notatkę">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="dangerGhost" size="icon" onClick={() => deleteDecision(decision.id)} title="Usuń">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mb-4 p-3 bg-primary/5 text-primary border border-primary/10 rounded-lg">
              <div className="text-xs font-bold uppercase tracking-wider mb-1">Wynik analizy</div>
              <div className="font-medium">{decision.result}</div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <Tag className="w-4 h-4" />
                Tagi
              </div>
              
              {editingId === decision.id && editingTags ? (
                <div className="flex flex-wrap items-center gap-2">
                  {editingTags.map((tag) => (
                    <Badge key={tag} variant="primary" className="pr-1">
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
                      className="px-3 py-1 bg-background border border-border rounded-full text-sm outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {decision.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <MessageSquare className="w-4 h-4" />
                Notatki
              </div>
              {editingId === decision.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => saveNotes(decision.id)}>Zapisz</Button>
                    <Button variant="secondary" onClick={() => { setEditingId(null); setEditingTags(null); }}>Anuluj</Button>
                  </div>
                </div>
              ) : (
                <p className="text-foreground leading-relaxed bg-muted/20 p-4 rounded-lg">{decision.notes}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredDecisions.length === 0 && (
        <div className="text-center py-16 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border">
          <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
          Nie znaleziono decyzji pasujących do zapytania.
        </div>
      )}
    </div>
  );
}