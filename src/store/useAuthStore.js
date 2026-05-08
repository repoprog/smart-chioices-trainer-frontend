import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/apiClient'; 

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,

            login: async (email, password) => {
                // Używamy apiClient (wykona POST na http://localhost:8080/api/v1/auth/login)
                const response = await apiClient.post('/api/v1/auth/login', { email, password });
                
                // Zakładamy, że backend zwraca taki obiekt: { accessToken: "...", user: { id, email, role } }
                const { accessToken, user } = response.data;
                
                // Zapisujemy token ręcznie do localStorage, bo apiClient z Kroku 1 stamtąd go czyta
                localStorage.setItem('sc_access_token', accessToken);

                // Aktualizujemy stan globalny
                set({ user, accessToken, isAuthenticated: true });
            },

            register: async (email, password) => {
                await apiClient.post('/api/v1/auth/register', { email, password });
                // Po udanej rejestracji od razu automatycznie logujemy użytkownika
                await get().login(email, password);
            },

            logout: async () => {
                try {
                    // Próbujemy powiadomić backend, żeby usunął ciasteczko z Refresh Tokenem
                    await apiClient.post('/api/v1/auth/logout');
                } catch (error) {
                    console.error("Błąd podczas wylogowywania na backendzie", error);
                } finally {
                    // Niezależnie od backendu, czyścimy frontend
                    localStorage.removeItem('sc_access_token');
                    set({ user: null, accessToken: null, isAuthenticated: false });
                }
            },

            refreshToken: async () => {
                // Ciasteczko HttpOnly z Refresh Tokenem leci automatycznie dzięki withCredentials: true
                const response = await apiClient.post('/api/v1/auth/refresh');
                const { accessToken } = response.data;
                
                localStorage.setItem('sc_access_token', accessToken);
                set({ accessToken, isAuthenticated: true });
                
                return accessToken;
            }
        }),
        {
            name: 'auth-storage', // Zustand automatycznie zapisze stan 'user' i 'isAuthenticated' pod tym kluczem w localStorage
        }
    )
);

export default useAuthStore;