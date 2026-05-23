import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
// DODANE: Importy do nawigacji i ścieżek
import { useLocation, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../constants/appConstants";

import useAuthStore from "../store/useAuthStore";
import { LogIn, AlertCircle, Mail, Lock, UserCheck } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/modals/Modal"; 

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  

  const location = useLocation();
  const navigate = useNavigate();
  
  const login = useAuthStore((state) => state.login);
  const pendingRedirectPath = useAuthStore((state) => state.pendingRedirectPath);
  const setPendingRedirectPath = useAuthStore((state) => state.setPendingRedirectPath);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // <-- DODANE: Wyciągamy reset z useForm!
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // GŁÓWNY ZAWÓR BEZPIECZEŃSTWA: Czyści stan przed zamknięciem
  const handleClose = () => {
    reset();                  
    setGlobalError("");       
    onClose();                
  };

  const handleSwitch = () => {
    handleClose(); // Zamykamy i czyścimy obecny modal
    if (onSwitchToRegister) onSwitchToRegister(); // Otwieramy rejestrację
  };

  const onSubmit = async (data) => {
    setGlobalError("");
    setLoading(true);

    try {
      await login(data.email, data.password);
      handleClose(); // Używamy naszego bezpiecznego zamknięcia
      
if (pendingRedirectPath) {
        setPendingRedirectPath(null); // Czyścimy pamięć
        navigate(pendingRedirectPath); // Wracamy do utraconego widoku (np. /app/panel)
      } else    if (location.pathname === APP_ROUTES.HOME || location.pathname === '/') {
        navigate(APP_ROUTES.TABLE);
      }
    } catch (err) {
      setGlobalError("Nieprawidłowy email lub hasło");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGlobalError("");
    setLoading(true);
    
    const email = import.meta.env.VITE_DEMO_EMAIL;
    const password = import.meta.env.VITE_DEMO_PASSWORD;
    
    if (!email || !password) {
      setGlobalError("Konto demo jest obecnie niedostępne ze względów konfiguracyjnych.");
      setLoading(false);
      return;
    }
    
    try {
      await login(email, password);
      handleClose(); // Używamy naszego bezpiecznego zamknięcia
      if (pendingRedirectPath) {
        setPendingRedirectPath(null);
        navigate(pendingRedirectPath);
      } else if (location.pathname === APP_ROUTES.HOME || location.pathname === '/') {
        navigate(APP_ROUTES.TABLE);
      }
    } catch {
      setGlobalError("Błąd logowania do konta demonstracyjnego.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ZMIANA: Podpinamy bezpieczne handleClose
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Decidely.</h1>
        <p className="text-muted-foreground mt-2">Witaj z powrotem</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {globalError && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm animate-in fade-in zoom-in-95">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {globalError}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          icon={Mail}
          placeholder="twoj@email.com"
          disabled={loading}
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Hasło"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          disabled={loading}
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" disabled={loading} className="w-full">
          <LogIn className="w-4 h-4 mr-2" />
          {loading ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border"></span>
        </div>
      </div>

      <Button 
        variant="secondary" 
        className="w-full" 
        onClick={handleGuestLogin}
        disabled={loading}
      >
        <UserCheck className="w-4 h-4 mr-2" />
        Zaloguj jako Gość (Demo)
      </Button>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <button 
          type="button"
          onClick={handleSwitch} // ZMIANA: Podpinamy bezpieczny switch
          className="text-primary font-medium hover:underline bg-transparent border-none p-0 cursor-pointer"
        >
          Zarejestruj się
        </button>
      </div>
    </Modal>
  );
}