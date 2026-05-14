import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],
  
  // Dodawanie powiadomienia do kolejki
  addToast: (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random(); // Gwarantujemy unikalne ID
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }]
    }));
  },

  // Usuwanie powiadomienia z kolejki (np. po kliknięciu X lub zakończeniu animacji)
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }));
  }
}));