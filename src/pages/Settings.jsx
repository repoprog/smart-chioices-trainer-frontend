import { useState } from "react";
import { User, Lock, Bell, Palette, Save, Mail } from "lucide-react";
import { Input } from "../components/ui/Input"; 
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card"; // <-- IMPORT NASZEJ KARTY

export default function Settings() {
  const [profileData, setProfileData] = useState({
    name: "Jan Kowalski",
    email: "jan.kowalski@example.com",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    decisionReminders: false,
    weeklyReport: true,
  });
  const [theme, setTheme] = useState("auto");

  const [passwordError, setPasswordError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // CORE MECHANIC: Password validation logic
  const handlePasswordChange = () => {
    setPasswordError("");
    setSuccessMessage("");

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("Wszystkie pola są wymagane");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Nowe hasła nie pasują do siebie");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("Nowe hasło musi mieć minimum 8 znaków");
      return;
    }

    setSuccessMessage("Hasło zostało zmienione pomyślnie");
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleProfileSave = () => {
    setSuccessMessage("Profil został zaktualizowany pomyślnie");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Ustawienia</h2>
        <p className="text-muted-foreground mt-1">Zarządzaj swoim kontem i preferencjami</p>
      </div>

      {successMessage && (
        <div className="p-4 bg-primary/10 text-primary border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
          {successMessage}
        </div>
      )}

      {/* PROFIL UŻYTKOWNIKA */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <User className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Profil użytkownika</h3>
        </div>

        <div className="space-y-4">
          <Input 
            label="Imię i nazwisko"
            icon={User}
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
          />

          <Input 
            label="Email"
            type="email"
            icon={Mail}
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
          />

          <Button onClick={handleProfileSave}>
            <Save className="w-4 h-4 mr-2" />
            Zapisz profil
          </Button>
        </div>
      </Card>

      {/* ZMIANA HASŁA */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Zmiana hasła</h3>
        </div>

        <div className="space-y-4">
          <Input 
            label="Obecne hasło"
            type="password"
            icon={Lock}
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
          />

          <Input 
            label="Nowe hasło"
            type="password"
            icon={Lock}
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
          />

          <Input 
            label="Potwierdź nowe hasło"
            type="password"
            icon={Lock}
            error={passwordError}
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
          />

          <Button onClick={handlePasswordChange}>
            <Save className="w-4 h-4 mr-2" />
            Zmień hasło
          </Button>
        </div>
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