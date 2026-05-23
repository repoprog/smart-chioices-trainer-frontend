import axios from 'axios';
import { API_PATHS } from '../constants/apiConstants';
import { STORAGE_KEYS } from '../constants/appConstants';

// --- NOWOŚĆ: Blokada zapobiegająca wielokrotnemu odświeżaniu tokena ---
let refreshPromise = null;

// 1. Inicjalizacja klienta
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true // Kluczowe! Wymusza wysyłanie ciasteczek HttpOnly do backendu
});

// 2. Request Interceptor - doklejanie tokena "do każdej paczki"
apiClient.interceptors.request.use(
    (config) => {
       
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Response Interceptor - strażnik błędu 401
apiClient.interceptors.response.use(
    (response) => {
        // Jeśli wszystko poszło dobrze, po prostu zwróć odpowiedź
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Jeśli dostaliśmy 401 (Unauthorized) i nie próbowaliśmy jeszcze ponowić tego zapytania
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Ustawiamy flagę, żeby nie wejść w nieskończoną pętlę

            //  Logika blokady (Lock) ---
            if (!refreshPromise) {
                // Jeśli nie ma obietnicy odświeżania w toku, tworzymy ją
                refreshPromise = axios.post(
                    `${import.meta.env.VITE_API_URL}${API_PATHS.AUTH.REFRESH}`,
                    {},
                    { withCredentials: true }
                ).finally(() => {
                    // Po udanym lub nieudanym odświeżeniu, zwalniamy blokadę
                    refreshPromise = null;
                });
            }

            try {
                // Wszystkie równoległe zapytania 401 będą czekać na tę jedną obietnicę
                const refreshResponse = await refreshPromise;

                // Pobieramy nowy token z odpowiedzi
                const newAccessToken = refreshResponse.data.accessToken;

                // Zapisujemy nowy token w localStorage 
                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);

                // Aktualizujemy nagłówek w oryginalnym zapytaniu i ponawiamy je
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);

            } catch (refreshError) {
                // Odświeżanie się nie udało (np. wygasł również Refresh Token)
              
                localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                
            
                const { default: useAuthStore } = await import('../store/useAuthStore');
                useAuthStore.setState({ user: null, isAuthenticated: false });
                
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;