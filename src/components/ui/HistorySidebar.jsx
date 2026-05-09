import React from "react";
import { X, Calendar, FileText } from "lucide-react";

export function HistorySidebar({
  isOpen,
  onClose,
  items = [],
  onSelectItem,
  type = "tree",
}) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] transition-opacity"
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-background border-l border-border shadow-2xl z-[101] transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xl">🕒</span>
              <h3 className="font-medium">Historia wersji</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 custom-scrollbar">
            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Brak zapisanych migawek</p>
                <p className="text-sm mt-1">
                  Zapisane wersje {type === "table" ? "tabeli" : "drzewa"} pojawią się tutaj
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectItem(item.id);
                      onClose();
                    }}
                    className="w-full text-left p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group"
                  >
                    <div className="font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.date).toLocaleDateString("pl-PL", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] uppercase font-bold rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-muted-foreground text-[10px] font-bold">
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-muted/30">
            <div className="text-xs text-muted-foreground text-center">
              {items.length} {items.length === 1 ? "zapisana wersja" : "zapisanych wersji"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}