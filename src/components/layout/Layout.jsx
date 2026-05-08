// src/components/layout/Layout.jsx
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Table2, Network, User, Settings as SettingsIcon, LogOut, LogIn, UserPlus } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate("/");
  };

  const publicMenuItems = [
    { path: "/app/table", label: "Tabela", icon: Table2 },
    { path: "/app/tree", label: "Drzewo", icon: Network },
  ];

  const privateMenuItems = [
    { path: "/app/panel", label: "Panel", icon: User },
    { path: "/app/settings", label: "Ustawienia", icon: SettingsIcon },
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border px-6 py-4 bg-card">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto w-full">
          
          {/* Lewa strona: Logo + Info o Userze bez pionowej kreski */}
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
              Decidely.
            </Link>
            {isAuthenticated && user && (
              <span className="text-sm font-medium text-muted-foreground hidden md:block">
                {user.email}
              </span>
            )}
          </div>

          {/* Prawa strona: Dynamiczna nawigacja */}
          <nav className="flex items-center gap-1">
            {publicMenuItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isActive(path) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}

            {isAuthenticated && privateMenuItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isActive(path) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}

            {/* Usunięto pionową kreskę oddzielającą */}

            {isAuthenticated ? (
              <Button
                variant="ghostDestructive"
                className="px-4 py-2 ml-1"
                onClick={() => setShowLogoutModal(true)}
              >
                <LogOut className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Wyloguj</span>
              </Button>
            ) : (
              <div className="flex gap-1 ml-1">
                {/* Usunięto size="sm", aby domyślnie używało text-sm (jak reszta nawigacji) */}
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  <LogIn className="w-4 h-4 mr-2" /> Zaloguj
                </Button>
                {/* Użycie wariantu dangerGhost wg wskazówek */}
                <Button variant="dangerGhost"
                 className="border border-destructive/40 hover:border-destructive/70"
                  onClick={() => navigate("/register")}>
                  <UserPlus className="w-4 h-4 mr-2" /> Dołącz
                </Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Wylogowanie"
        message="Czy na pewno chcesz się wylogować?"
        confirmText="Wyloguj"
        variant="warning"
      />

      <main className="flex-1 overflow-y-scroll bg-muted/20">
        <div className="max-w-[1400px] mx-auto px-6 py-8 h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}