import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/apiClient'; 
import { API_PATHS } from '../constants/apiConstants';
import { STORAGE_KEYS } from '../constants/appConstants';
import { useTreeStore } from '../features/DecisionTree/store/useTreeStore';
import { useTableStore } from '../features/DecisionTable/store/useTableStore';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            pendingRedirectPath: null,

            // --- NOWOŚĆ: Stan Modali Autoryzacyjnych ---
            isLoginModalOpen: false,
            isRegisterModalOpen: false,
            
            setPendingRedirectPath: (path) => set({ pendingRedirectPath: path }),
            
            openLoginModal: () => set({ isLoginModalOpen: true, isRegisterModalOpen: false, error: null }),
            openRegisterModal: () => set({ isRegisterModalOpen: true, isLoginModalOpen: false, error: null }),
            closeAuthModals: () => set({ isLoginModalOpen: false, isRegisterModalOpen: false, error: null }),
           

            fetchProfile: async () => {
                try {
                    // Uderzamy do naszego nowego endpointu GET /api/v1/users/me
                    const response = await apiClient.get(API_PATHS.USERS.ME); 
                    
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

                    // Aktualizacja stanu i natychmiastowe ZAMKNIĘCIE modali po sukcesie
                    set({ 
                        user, 
                        isAuthenticated: true, 
                        isLoading: false,
                        isLoginModalOpen: false,
                        isRegisterModalOpen: false 
                    });
                    
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
                    await apiClient.post(API_PATHS.AUTH.LOGOUT);
                } catch (error) {
                    console.error("Błąd podczas wylogowywania na backendzie", error);
                } finally {
                    // 1. Usuń główny token
                    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);

                    // 2. Wyczyść twardy dysk (localStorage) z danych innych modułów
                    localStorage.removeItem('tree-storage');
                    localStorage.removeItem('table-storage');

                    // 3. Wyczyść miękką pamięć (Zustand), żeby UI zniknęło natychmiast
                    useTreeStore.getState().resetTree();
                    
                    // Upewnij się, że w useTableStore masz funkcję o nazwie resetAll (lub zmień na właściwą np. resetTable)
                    useTableStore.getState().resetAll(); 

                    // 4. Ubij stan autoryzacji oraz ZAMKNIJ wszystkie wiszące modale
                    set({ 
                        user: null, 
                        isAuthenticated: false, 
                        isLoading: false, 
                        error: null,
                        isLoginModalOpen: false,    // DODANE: Zabezpieczenie przed "ghost modals"
                        isRegisterModalOpen: false, // DODANE: Zabezpieczenie przed "ghost modals"
                        pendingRedirectPath: null   // (To dodaliśmy w poprzednim kroku naprawy protected route)
                    });
                }
            }
            
            // USUNIĘTO: Funkcja refreshToken() została całkowicie wyrzucona, 
            // ponieważ odświeżaniem zajmuje się wyłącznie interceptor axiosa w apiClient.js
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