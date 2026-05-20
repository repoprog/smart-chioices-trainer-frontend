import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom"; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useAuthStore from "../../store/useAuthStore";
import { UserPlus, AlertCircle, Mail, Lock, User } from "lucide-react"; 
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { APP_ROUTES } from "../../constants/appConstants"; 
import { Input } from "../../components/ui/Input";

const registerSchema = z.object({
  name: z.string().min(2, "Imię musi mieć co najmniej 2 znaki"), 
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie pasują do siebie",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const registerAction = useAuthStore((state) => state.register);
  const navigate = useNavigate();
  const location = useLocation(); 

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setGlobalError("");
    setLoading(true);

    try {
      // DODANO przekazywanie imienia (data.name) do akcji rejestracji
      await registerAction(data.name, data.email, data.password);
      const params = new URLSearchParams(location.search);
      const returnTo = params.get('returnTo') || APP_ROUTES.PANEL;
      navigate(returnTo);
    } catch (err) {
      setGlobalError("Użytkownik z tym adresem email prawdopodobnie już istnieje");
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {globalError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm animate-in fade-in zoom-in-95">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {globalError}
              </div>
            )}

         
            <Input
              label="Imię"
              type="text"
              icon={User}
              placeholder="np. Jan"
              disabled={loading}
              error={errors.name?.message}
              {...register("name")}
            />

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

            <Input
              label="Potwierdź hasło"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              disabled={loading}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
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