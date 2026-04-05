import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CountryFilter } from "@/components/CountryFilter";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  hideCountryFilter?: boolean;
}

export function DashboardLayout({ children, title, subtitle, hideCountryFilter }: Props) {
  const { user, countryAccess, signOut } = useAuth();

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "?";

  // País label do usuário restrito
  const countryLabel = countryAccess === "uruguay" ? "🇺🇾 UY" : countryAccess === "brasil" ? "🇧🇷 BR" : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div>
                <h1 className="text-sm font-semibold text-foreground">{title}</h1>
                {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Só mostra o filtro de país se não estiver escondido e o usuário não for restrito */}
              {!hideCountryFilter && !countryAccess && <CountryFilter />}

              {/* Badge de acesso restrito */}
              {countryLabel && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                  {countryLabel}
                </span>
              )}

              <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative">
                <Bell className="w-4 h-4" />
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-chart-negative" />
              </button>

              {/* Avatar + email */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">{initials}</span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={signOut}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
