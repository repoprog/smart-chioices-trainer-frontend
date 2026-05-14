import axios from 'axios';
import { API_PATHS } from '../constants/apiConstants';
import { STORAGE_KEYS } from '../constants/appConstants';

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

            try {
                // Próba odświeżenia tokena. Zwykły axios, nie apiClient, żeby nie wpaść w pętlę interceptorów!
                const refreshResponse = await axios.post(
                    `${import.meta.env.VITE_API_URL}${API_PATHS.AUTH.REFRESH}`,
                    {},
                    { withCredentials: true }
                );

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
                
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;