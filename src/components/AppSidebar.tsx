import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Settings,
  Wallet,
  DollarSign,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/context/AuthContext";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { countryAccess } = useAuth();

  const isBrasilActive = location.pathname.startsWith("/brasil");
  const isUruguayActive = location.pathname.startsWith("/uruguay");

  const showBrasil  = countryAccess !== "uruguay";
  const showGlobal  = !countryAccess;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold text-foreground tracking-tight">FinanceOS</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Controle Financeiro</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {showGlobal && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/" end className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Visão Geral</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Brasil — oculto para usuários com acesso apenas Uruguay */}
              {showBrasil && <Collapsible defaultOpen={isBrasilActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`hover:bg-muted/50 ${isBrasilActive ? "bg-primary/10 text-primary font-medium" : ""}`}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">🇧🇷 Brasil</span>
                          <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <NavLink to="/brasil" end className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                            <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                            Dashboard
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <NavLink to="/brasil/recebiveis" className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                            <Wallet className="mr-2 h-3.5 w-3.5" />
                            Receitas
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <NavLink to="/brasil/despesas" className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                            <ArrowLeftRight className="mr-2 h-3.5 w-3.5" />
                            Despesas
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>}

              {/* Uruguay */}
              <Collapsible defaultOpen={isUruguayActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`hover:bg-muted/50 ${isUruguayActive ? "bg-primary/10 text-primary font-medium" : ""}`}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">🇺🇾 Uruguay</span>
                          <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <NavLink to="/uruguay" end className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                            <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                            Dashboard
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <NavLink to="/uruguay/recebiveis" className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                            <Wallet className="mr-2 h-3.5 w-3.5" />
                            Receitas
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <NavLink to="/uruguay/despesas" className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                            <ArrowLeftRight className="mr-2 h-3.5 w-3.5" />
                            Despesas
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Global pages — apenas para acesso total */}
              {showGlobal && <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/recebiveis" className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                      <Wallet className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Receitas (Todos)</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/despesas" className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Despesas (Todos)</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/projecoes" className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-medium">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Projeções</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/configuracoes" className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary">
                <Settings className="mr-2 h-4 w-4" />
                {!collapsed && <span>Configurações</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
