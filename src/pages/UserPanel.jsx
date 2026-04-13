import { useState } from "react";
import { Search, Edit2, Trash2, Calendar, MessageSquare, X, Plus, Tag } from "lucide-react";
import { Button } from "../components/ui/Button"; // Importujemy nasz przycisk

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
    {
      id: "3",
      title: "Strategia marketingowa",
      type: "table",
      date: "2026-03-28",
      result: "Opcja A - wynik: 189 punktów",
      notes: "Kampania cyfrowa z focus na social media. Budget zwiększony o 15%.",
      tags: ["marketing", "biznes", "strategia"],
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
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 || selectedTags.some((tag) => d.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const startEditing = (decision) => {
    setEditingId(decision.id);
    setEditedNotes(decision.notes);
    setEditingTags(decision.tags);
  };

  const saveNotes = (id) => {
    setDecisions(
      decisions.map((d) =>
        d.id === id ? { ...d, notes: editedNotes, tags: editingTags || d.tags } : d
      )
    );
    setEditingId(null);
    setEditingTags(null);
  };

  const deleteDecision = (id) => {
    setDecisions(decisions.filter((d) => d.id !== id));
  };

  const toggleTagFilter = (tag) => {
    setSelectedTags(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag]
    );
  };

  const addTagToEditing = () => {
    if (newTagInput.trim() && editingTags && !editingTags.includes(newTagInput.trim())) {
      setEditingTags([...editingTags, newTagInput.trim()]);
      setNewTagInput("");
    }
  };

  const removeTagFromEditing = (tag) => {
    if (editingTags) {
      setEditingTags(editingTags.filter((t) => t !== tag));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Panel użytkownika</h2>
          <p className="text-muted-foreground mt-1">Przeglądaj i zarządzaj swoimi decyzjami</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Szukaj decyzji..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium">Filtruj według tagów</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Button
              key={tag}
              variant={selectedTags.includes(tag) ? "tagActive" : "tag"}
              size="tagSize"
              onClick={() => toggleTagFilter(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
        {selectedTags.length > 0 && (
          <button
            onClick={() => setSelectedTags([])}
            className="text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors"
          >
            Wyczyść filtry
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filteredDecisions.map((decision) => (
          <div key={decision.id} className="border border-border rounded-lg p-5 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{decision.title}</h3>
                  <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                    {decision.type === "table" ? "Tabela" : "Drzewo"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(decision.date).toLocaleDateString("pl-PL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEditing(decision)}
                  title="Edytuj notatkę"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="dangerGhost"
                  size="icon"
                  onClick={() => deleteDecision(decision.id)}
                  title="Usuń"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium">Wynik decyzji</div>
              <div className="mt-1">{decision.result}</div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Tag className="w-4 h-4" />
                Tagi
              </div>
              {editingId === decision.id && editingTags ? (
                <div className="flex flex-wrap gap-2">
                  {editingTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {tag}
                      {/* Zostawiam tu natywny button, bo to mini-krzyżyk wewnątrz taga */}
                      <button
                        onClick={() => removeTagFromEditing(tag)}
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex gap-1 items-center">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTagToEditing()}
                      placeholder="Nowy tag..."
                      className="px-2 py-1 bg-background border border-border rounded-full text-sm outline-none focus:border-primary transition-colors"
                    />
                    <Button
                      size="sm"
                      className="rounded-full px-2 py-1 h-auto"
                      onClick={addTagToEditing}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {decision.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MessageSquare className="w-4 h-4" />
                Notatki
              </div>
              {editingId === decision.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:border-primary transition-colors resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveNotes(decision.id)}>
                      Zapisz
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingId(null);
                        setEditingTags(null);
                      }}
                    >
                      Anuluj
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">{decision.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredDecisions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nie znaleziono decyzji pasujących do zapytania
        </div>
      )}
    </div>
  );
}