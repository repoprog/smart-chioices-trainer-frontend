import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/apiClient'; 
import { API_PATHS } from '../constants/apiConstants';
import { STORAGE_KEYS } from '../constants/appConstants';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            fetchProfile: async () => {
                try {
                    // Uderzamy do naszego nowego endpointu GET /api/v1/users/me
                    const response = await apiClient.get('/api/v1/users/me'); 
                    
                    set((state) => ({
                        // Aktualizujemy dane usera, łącząc to, co mamy, z nowymi danymi (np. dodając 'name')
                        user: { ...state.user, ...response.data }
                    }));
                } catch (error) {
                    console.error("Błąd podczas odświeżania profilu:", error);
                    // Opcjonalnie: jeśli token wygasł (401), wymuszamy wylogowanie
                    if (error.response?.status === 401) {
                        get().logout();
                    }
                }
            },

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                // Używamy apiClient (wykona POST na http://localhost:8080/api/v1/auth/login)
               const response = await apiClient.post(API_PATHS.AUTH.LOGIN, { email, password });
                
                // Zakładamy, że backend zwraca taki obiekt: { accessToken: "...", user: { id, email, role } }
                const { accessToken, user } = response.data;
                
                // Zapisujemy token WYŁĄCZNIE do localStorage jako jedyne źródło prawdy (Single Source of Truth)
               localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

                // Aktualizujemy stan globalny (bez tokena!)
                set({ user, isAuthenticated: true, isLoading: false });
                // --- NOWOŚĆ: Po pomyślnym logowaniu dociągamy pełny profil (z imieniem) ---
                    await get().fetchProfile();
                } catch (error) {
                    set({ isLoading: false, error: error.response?.data?.message || 'Błąd logowania' });
                    throw error;
                }
                
            },

            // Przyjmujemy 'name' jako pierwszy argument
            register: async (name, email, password) => {
                set({ isLoading: true, error: null });
                try {
                    
                    await apiClient.post(API_PATHS.AUTH.REGISTER, { name, email, password });
                    
                    await get().login(email, password);
                } catch (error) {
                    set({ isLoading: false, error: error.response?.data?.message || 'Błąd rejestracji' });
                    throw error;
                }
            },

            logout: async () => {
                set({ isLoading: true });
                try {
                    // Próbujemy powiadomić backend, żeby usunął ciasteczko z Refresh Tokenem
                  await apiClient.post(API_PATHS.AUTH.LOGOUT);
                } catch (error) {
                    console.error("Błąd podczas wylogowywania na backendzie", error);
                } finally {
                    // Niezależnie od backendu, czyścimy frontend
                   localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                   set({ user: null, isAuthenticated: false, isLoading: false, error: null });
                }
            },
            updateUser: (updatedData) => {
    set((state) => ({
        user: { ...state.user, ...updatedData }
    }));
},

            refreshToken: async () => {
                // Ciasteczko HttpOnly z Refresh Tokenem leci automatycznie dzięki withCredentials: true
                // Zwykle to interceptor w apiClient robi to w tle, ale zostawiamy to jako funkcję pomocniczą
                const response = await apiClient.post(API_PATHS.AUTH.REFRESH);
                const { accessToken } = response.data;
                
                // Token ląduje tylko w localStorage
               localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
                set({ isAuthenticated: true });
                
                return accessToken;
            }
            
        }),
        
        {
            name: STORAGE_KEYS.AUTH,
            // ZABEZPIECZENIE: Zustand zapisze na dysku TYLKO usera i flagę 'isAuthenticated'
            // Ignoruje isLoading i error, dzięki czemu po (F5) stany błędów i ładowania się resetują!
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore;