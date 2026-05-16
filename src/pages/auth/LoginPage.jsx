import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom"; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useAuthStore from "../../store/useAuthStore";
import { LogIn, AlertCircle, Mail, Lock, UserCheck } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card"; 
import { APP_ROUTES } from "../../constants/appConstants"; 

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export default function LoginPage() {
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation(); 

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setGlobalError("");
    setLoading(true);

    try {
      await login(data.email, data.password);
      const params = new URLSearchParams(location.search);
      const returnTo = params.get('returnTo') || APP_ROUTES.PANEL;
      navigate(returnTo);
    } catch (err) {
      setGlobalError("Nieprawidłowy email lub hasło");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGlobalError("");
    setLoading(true);
    try {
      await login("janek@wp.pl", "12341234");
      const params = new URLSearchParams(location.search);
      const returnTo = params.get('returnTo') || APP_ROUTES.PANEL;
      navigate(returnTo);
    } catch (err) {
      setGlobalError("Błąd logowania demo. Spróbuj ręcznie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Decidely.</h1>
          <p className="text-muted-foreground">Witaj z powrotem</p>
        </div>

        <Card className="p-8">
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
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Lub sprawdź wersję demo</span></div>
          </div>

          <Button 
            variant="secondary" 
            className="w-full" 
            onClick={handleGuestLogin}
            disabled={loading}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Zaloguj jako Gość (Rekruter)
          </Button>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Nie masz konta? <Link to={`${APP_ROUTES.REGISTER}${location.search}`} className="text-primary font-medium hover:underline">Zarejestruj się</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}