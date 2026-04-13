import { Link, Outlet, useLocation } from "react-router-dom";
import { Table2, Network, User, Settings as SettingsIcon } from "lucide-react";

export function Layout() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };


  const menuItems = [
    { path: "/app/table", label: "Tabela", icon: Table2 },
    { path: "/app/tree", label: "Drzewo", icon: Network },
    { path: "/app/panel", label: "Panel", icon: User },
    { path: "/app/settings", label: "Ustawienia", icon: SettingsIcon },
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
     
      <header className="border-b border-border px-6 py-4 bg-card">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto w-full">
          <Link to="/" className="text-xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">
            Decidely.
          </Link>

          <nav className="flex gap-1">
            {menuItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isActive(path)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-scroll bg-muted/20">
        <div className="max-w-[1400px] mx-auto px-6 py-8 h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}