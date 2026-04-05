import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CountryFilter } from "@/components/CountryFilter";
import { Bell, Search } from "lucide-react";

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  hideCountryFilter?: boolean;
}

export function DashboardLayout({ children, title, subtitle, hideCountryFilter }: Props) {
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
              <CountryFilter />
              <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <Search className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative">
                <Bell className="w-4 h-4" />
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-chart-negative" />
              </button>
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center ml-1">
                <span className="text-[10px] font-bold text-primary">CF</span>
              </div>
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
