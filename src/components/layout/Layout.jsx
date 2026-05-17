// src/components/layout/Layout.jsx
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Table2, Network, User, Settings as SettingsIcon, LogOut, LogIn, UserPlus, TableRowsSplitIcon } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";


import {useTableStore} from "../../features/DecisionTable/store/useTableStore";
import {useTreeStore} from "../../features/DecisionTree/store/useTreeStore";

import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";
import { ToastContainer } from "../ui/ToastContainer";
import { APP_ROUTES } from "../../constants/appConstants"; 

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);


  const isTablePreview = useTableStore(s => s.isPreviewMode);
  const isTreePreview = useTreeStore(s => s.isPreviewMode);
  const isAnyPreview = isTablePreview || isTreePreview;

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate(APP_ROUTES.HOME); 
  };

  const publicMenuItems = [
    { path: APP_ROUTES.TABLE, label: "Tabela", icon: Table2 }, 
    { path: APP_ROUTES.TREE, label: "Drzewo", icon: Network }, 
  ];

  const privateMenuItems = [
    { path: APP_ROUTES.PANEL, label: "Panel", icon: User }, 
    { path: APP_ROUTES.SETTINGS, label: "Ustawienia", icon: SettingsIcon }, 
  ];

  return (
    
    <div className={`h-screen flex flex-col bg-background transition-all duration-300 ${isAnyPreview ? "pt-[60px]" : ""}`}>
      <header className="border-b border-border px-6 py-4 bg-card">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto w-full">
         {/* Loged user info */}
<div className="flex items-center gap-4">
  <Link to={APP_ROUTES.HOME} className="text-xl font-bold tracking-tight text-foreground">
    Decidely.
  </Link>
  {isAuthenticated && user && (
    <span className="text-sm font-medium text-muted-foreground hidden md:block">
      {/* ZMIANA TUTAJ: Wyświetl imię, a jeśli go nie ma (null/puste), wyświetl email */}
      {user.name || user.email}
    </span>
  )}
</div>

          {/* Navigation  */}
          <nav className={`flex items-center gap-1 transition-all duration-300 ${
            isAnyPreview ? "pointer-events-none opacity-40 grayscale" : ""
          }`}>
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

          

           {isAuthenticated ? (
  <Button
    variant="ghostDestructive"
    className="px-2 md:px-4 py-2 ml-1"
    onClick={() => setShowLogoutModal(true)}
  >
    <LogOut className="w-4 h-4 md:mr-2" />
    <span className="hidden md:inline">Wyloguj</span>
  </Button>
) : (
  <div className="flex gap-1 ml-1">
    <Button 
      variant="ghost" 
      className="px-2 md:px-4"
      onClick={() => navigate(`${APP_ROUTES.LOGIN}?returnTo=${encodeURIComponent(location.pathname)}`)}
    >
      <LogIn className="w-4 h-4 md:mr-2" /> 
      <span className="hidden md:inline">Zaloguj</span>
    </Button>
    <Button 
    variant="dangerActive"
    className="px-2 md:px-4"
    onClick={() => navigate(`${APP_ROUTES.REGISTER}?returnTo=${encodeURIComponent(location.pathname)}`)}
  >
    <UserPlus className="w-4 h-4 md:mr-2" /> 
    <span className="hidden md:inline">Dołącz</span>
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
      <ToastContainer />
    </div>
  );
}