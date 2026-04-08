import { useState } from "react";
import { User, Lock, Bell, Palette, Save } from "lucide-react";

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
        <h2>Ustawienia</h2>
        <p className="text-muted-foreground mt-1">Zarządzaj swoim kontem i preferencjami</p>
      </div>

      {successMessage && (
        <div className="p-4 bg-primary/10 text-primary border border-primary/20 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="border border-border rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <User className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium">Profil użytkownika</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Imię i nazwisko</label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary transition-colors"
            />
          </div>

          <button
            onClick={handleProfileSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Zapisz profil
          </button>
        </div>
      </div>

      <div className="border border-border rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium">Zmiana hasła</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Obecne hasło</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nowe hasło</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Potwierdź nowe hasło</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary transition-colors"
            />
          </div>

          {passwordError && (
            <div className="text-sm text-destructive">{passwordError}</div>
          )}

          <button
            onClick={handlePasswordChange}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Zmień hasło
          </button>
        </div>
      </div>

      <div className="border border-border rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium">Powiadomienia</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">Powiadomienia email</div>
              <div className="text-sm text-muted-foreground">Otrzymuj powiadomienia na email</div>
            </div>
            <input
              type="checkbox"
              checked={notifications.emailNotifications}
              onChange={(e) =>
                setNotifications({ ...notifications, emailNotifications: e.target.checked })
              }
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">Przypomnienia o decyzjach</div>
              <div className="text-sm text-muted-foreground">
                Otrzymuj przypomnienia o zaplanowanych decyzjach
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifications.decisionReminders}
              onChange={(e) =>
                setNotifications({ ...notifications, decisionReminders: e.target.checked })
              }
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">Cotygodniowy raport</div>
              <div className="text-sm text-muted-foreground">
                Otrzymuj podsumowanie decyzji co tydzień
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifications.weeklyReport}
              onChange={(e) =>
                setNotifications({ ...notifications, weeklyReport: e.target.checked })
              }
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </label>
        </div>
      </div>

      <div className="border border-border rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Palette className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium">Motyw aplikacji</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["light", "dark", "auto"].map((themeOption) => (
            <button
              key={themeOption}
              onClick={() => setTheme(themeOption)}
              className={`p-4 border rounded-lg transition-colors ${
                theme === themeOption
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-medium capitalize">
                {themeOption === "light" ? "Jasny" : themeOption === "dark" ? "Ciemny" : "Auto"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {themeOption === "light"
                  ? "Zawsze jasny motyw"
                  : themeOption === "dark"
                  ? "Zawsze ciemny motyw"
                  : "Dostosuj do systemu"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
