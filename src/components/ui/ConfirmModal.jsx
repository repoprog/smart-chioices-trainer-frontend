import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

export  function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Potwierdź",
  cancelText = "Anuluj",
  variant = "warning",
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: "bg-destructive hover:opacity-90 text-destructive-foreground",
    warning: "bg-primary hover:opacity-90 text-primary-foreground",
    info: "bg-primary hover:opacity-90 text-primary-foreground",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="space-y-4 text-foreground">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${
            variant === "danger" ? "bg-destructive/10" : "bg-primary/10"
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              variant === "danger" ? "text-destructive" : "text-primary"
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="font-medium mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg transition-colors ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}