// src/pages/auth/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom"; 
import useAuthStore from "../../store/useAuthStore";
import { UserPlus, AlertCircle, Mail, Lock } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { APP_ROUTES } from "../../constants/appConstants"; 

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();
  const location = useLocation(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password || !confirmPassword) {
      setError("Wszystkie pola są wymagane");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Hasła nie pasują do siebie");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Hasło musi mieć minimum 8 znaków");
      setLoading(false);
      return;
    }

    try {
      await register(email, password);
     
      const params = new URLSearchParams(location.search);
    
      const returnTo = params.get('returnTo') || APP_ROUTES.PANEL;
      navigate(returnTo);
    } catch (err) {
      setError("Użytkownik z tym adresem email prawdopodobnie już istnieje");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium mb-2 text-foreground">Decidely.</h1>
          <p className="text-muted-foreground">Utwórz nowe konto</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm animate-in fade-in zoom-in-95">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="twoj@email.com"
              disabled={loading}
            />

            <Input
              label="Hasło"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              error={password.length > 0 && password.length < 8 ? "Minimum 8 znaków" : ""}
            />

            <Input
              label="Potwierdź hasło"
              type="password"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? "Rejestracja..." : "Zarejestruj się"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Masz już konto?{" "}
            <Link to={`${APP_ROUTES.LOGIN}${location.search}`} className="text-primary font-medium hover:underline">
              Zaloguj się
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}