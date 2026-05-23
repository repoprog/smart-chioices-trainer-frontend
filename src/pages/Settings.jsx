import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Lock, Bell, Palette, Save, Mail } from "lucide-react";

import { Input } from "../components/ui/Input"; 
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { userApi } from "../api/userApi";
import useAuthStore from "../store/useAuthStore";
// IMPORT TWOJEGO STORE'A OD TOASTÓW:
import { useToastStore } from "../store/useToastStore"; 

const profileSchema = z.object({
  name: z.string().min(2, "Imię musi mieć minimum 2 znaki"),
  email: z.string().email("Nieprawidłowy format adresu email"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Obecne hasło jest wymagane"),
  newPassword: z.string().min(8, "Nowe hasło musi mieć minimum 8 znaków"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Nowe hasła nie pasują do siebie",
  path: ["confirmPassword"],
});

export default function Settings() {
  const { user, fetchProfile } = useAuthStore(); 
  const addToast = useToastStore((state) => state.addToast); 
  
  const [isLoading, setIsLoading] = useState(false);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    decisionReminders: false,
    weeklyReport: true,
  });
  const [theme, setTheme] = useState("auto");

  // Formularz Profilu
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "", 
      email: user?.email || "",
    }
  });

  // Upewniamy się, że po odświeżeniu strony/załadowaniu usera formularz dostaje dane
  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.name, email: user.email });
    }
  }, [user, profileForm]);

  // Formularz Hasła
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const onProfileSubmit = async (data) => {
    setIsLoading(true);
    try {
      // 1. Zapisujemy na serwerze
      await userApi.updateProfile(data);
      
      // 2. Pobieramy ŚWIEŻE dane z serwera do globalnego stanu (Zustand)
      await fetchProfile();
      
      // 3. Resetujemy formularz Z NOWYMI DANYMI. 
      // To zdejmuje flagę "isDirty" z formularza i uaktualnia wartości początkowe.
      profileForm.reset({ name: data.name, email: data.email });
      
     addToast("Profil został zaktualizowany pomyślnie", "success");

    } catch (err) {
      const errMsg = err.response?.data?.message || "Nie udało się zaktualizować profilu";
      // TWOJE POWIADOMIENIE (Błąd)
      addToast(errMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      };
      
      await userApi.updatePassword(payload);
      
      // TWOJE POWIADOMIENIE (Sukces)
      addToast("Hasło zostało zmienione pomyślnie", "success");
      
      passwordForm.reset(); 
    } catch (err) {
      const errMsg = err.response?.data?.message || "Obecne hasło jest nieprawidłowe";
      
      // TWOJE POWIADOMIENIE (Błąd)
      addToast(errMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Ustawienia</h2>
        <p className="text-muted-foreground mt-1">Zarządzaj swoim kontem i preferencjami</p>
      </div>

      {/* PROFIL UŻYTKOWNIKA */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <User className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Profil użytkownika</h3>
        </div>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <Input 
            label="Imię i nazwisko"
            icon={User}
            error={profileForm.formState.errors.name?.message}
            {...profileForm.register("name")}
          />

          <Input 
            label="Email"
            type="email"
            icon={Mail}
            error={profileForm.formState.errors.email?.message}
            {...profileForm.register("email")}
          />

          <Button type="submit" disabled={isLoading || !profileForm.formState.isDirty}>
            <Save className="w-4 h-4 mr-2" />
            Zapisz profil
          </Button>
        </form>
      </Card>

      {/* ZMIANA HASŁA */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Zmiana hasła</h3>
        </div>

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <Input 
            label="Obecne hasło"
            type="password"
            icon={Lock}
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register("currentPassword")}
          />

          <Input 
            label="Nowe hasło"
            type="password"
            icon={Lock}
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register("newPassword")}
          />

          <Input 
            label="Potwierdź nowe hasło"
            type="password"
            icon={Lock}
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register("confirmPassword")}
          />

          <Button type="submit" disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            Zmień hasło
          </Button>
        </form>
      </Card>

      {/* POWIADOMIENIA */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Powiadomienia</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <div className="font-medium group-hover:text-primary transition-colors text-foreground">Powiadomienia email</div>
              <div className="text-sm text-muted-foreground">Otrzymuj powiadomienia na email</div>
            </div>
            <input
              type="checkbox"
              checked={notifications.emailNotifications}
              onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <div className="font-medium group-hover:text-primary transition-colors text-foreground">Przypomnienia o decyzjach</div>
              <div className="text-sm text-muted-foreground">Otrzymuj przypomnienia o zaplanowanych decyzjach</div>
            </div>
            <input
              type="checkbox"
              checked={notifications.decisionReminders}
              onChange={(e) => setNotifications({ ...notifications, decisionReminders: e.target.checked })}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </label>
        </div>
      </Card>

      {/* MOTYW */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Palette className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Motyw aplikacji</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["light", "dark", "auto"].map((themeOption) => (
            <button
              key={themeOption}
              onClick={() => setTheme(themeOption)}
              className={`p-4 border rounded-lg transition-all ${
                theme === themeOption
                  ? "border-primary bg-primary/5 shadow-sm text-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/30 text-foreground"
              }`}
            >
              <div className="font-medium capitalize">
                {themeOption === "light" ? "Jasny" : themeOption === "dark" ? "Ciemny" : "Auto"}
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}