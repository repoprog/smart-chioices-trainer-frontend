import { Link, Outlet, useLocation } from "react-router-dom";
import { Table2, Network, User, Settings as SettingsIcon } from "lucide-react";

export function Layout() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 bg-card">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto w-full">
          <Link to="/" className="text-xl font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">
            Decidely.
          </Link>

          <nav className="flex gap-1">
            <Link
              to="/app/tabela"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                isActive("/app/tabela")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Table2 className="w-4 h-4" />
              <span>Tabela</span>
            </Link>

            <Link
              to="/app/drzewo"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                isActive("/app/drzewo")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Drzewo</span>
            </Link>

            <Link
              to="/app/panel"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                isActive("/app/panel")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Panel</span>
            </Link>

            <Link
              to="/app/ustawienia"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                isActive("/app/ustawienia")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Ustawienia</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-muted/20">
        <div className="max-w-[1400px] mx-auto px-6 py-8 h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}