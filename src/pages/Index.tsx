import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { KPICard } from "@/components/KPICard";
import { ScenarioCard } from "@/components/ScenarioCard";
import { DateFilter } from "@/components/DateFilter";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { ExpensePieChart } from "@/components/ExpensePieChart";
import {
  formatCurrency, formatCompact, formatDate,
  getTotalAccountsPayable, dailyEntries, monthlyFlowData,
} from "@/lib/finance-data";
import { useFinance } from "@/context/FinanceContext";
import { useLibertyData } from "@/hooks/useLibertyData";
import { useAdsSpend } from "@/hooks/useAdsSpend";
import { useQueryClient } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  DollarSign, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight,
  Landmark, Target, Pencil, Check, X, Banknote, Package, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

// Product cost per unit by country
const PRODUCT_COST = { brasil: 13, uruguay: 5 };
// Fixed shipping for Uruguay per unit
const FRETE_FIXO_UY = 35;

const Index = () => {
  const {
    selectedDate, dateRange, expenses, countryFilter,
    manualCash, setManualCash,
    manualSaqueBR, setManualSaqueBR,
    manualSaqueUY, setManualSaqueUY,
  } = useFinance();
  const { data: libertyData, isLoading: libertyLoading } = useLibertyData(dateRange.from, dateRange.to);
  const { data: adsData, isLoading: adsLoading } = useAdsSpend(dateRange.from, dateRange.to);
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingCash, setEditingCash] = useState(false);
  const [cashInput, setCashInput] = useState("");
  const [editingSaqueBR, setEditingSaqueBR] = useState(false);
  const [saqueBRInput, setSaqueBRInput] = useState("");
  const [editingSaqueUY, setEditingSaqueUY] = useState(false);
  const [saqueUYInput, setSaqueUYInput] = useState("");

  // Select summary based on country filter
  const summary = useMemo(() => {
    if (!libertyData) return undefined;
    if (countryFilter === "brasil") return libertyData.summaryBrasil;
    if (countryFilter === "uruguay") return libertyData.summaryUruguay;
    return libertyData.summary;
  }, [libertyData, countryFilter]);

  const pedidos = useMemo(() => {
    const all = libertyData?.pedidos ?? [];
    if (countryFilter === "todos") return all;
    return all.filter(p => {
      const pais = (p.pais || "").toLowerCase();
      if (countryFilter === "brasil") return pais === "br" || pais === "brasil";
      if (countryFilter === "uruguay") return pais === "uy" || pais === "uruguay";
      return false;
    });
  }, [libertyData, countryFilter]);

  // Ads data per country
  const currentAdsData = useMemo(() => {
    if (!adsData) return undefined;
    if (countryFilter === "brasil") return adsData.brasil;
    if (countryFilter === "uruguay") return adsData.uruguay;
    return adsData;
  }, [adsData, countryFilter]);

  // Filter expenses by period
  const periodExpenses = useMemo(() =>
    expenses.filter(e => e.date >= dateRange.from && e.date <= dateRange.to),
    [expenses, dateRange]
  );

  const periodDailyEntries = useMemo(() =>
    dailyEntries.filter(d => d.date >= dateRange.from && d.date <= dateRange.to),
    [dateRange]
  );

  const periodIncome = periodDailyEntries.reduce((s, d) => s + d.totalIn, 0);
  const periodOut = periodDailyEntries.reduce((s, d) => s + d.totalOut, 0);
  const periodGrossProfit = periodIncome - periodOut;
  const totalExpensesPeriod = periodExpenses.reduce((s, e) => s + e.amount, 0);

  const totalReceivable = summary?.totalPendente ?? 0;
  const totalReceived = summary?.totalPago ?? 0;
  const totalRecebidoPix = summary?.totalPagoPix ?? 0;
  const totalRecebidoCartaoBoleto = (summary?.totalPagoCartao ?? 0) + (summary?.totalPagoBoleto ?? 0);

  const totalPayable = getTotalAccountsPayable();
  const scheduledExpenses = periodExpenses.filter(e => e.status === "agendado").reduce((s, e) => s + e.amount, 0);
  const totalPayableWithScheduled = totalPayable + scheduledExpenses;
  const currentCash = manualCash !== null ? manualCash : (periodIncome - periodOut);

  // Frete: Brasil uses API data, Uruguay uses fixed R$35 per unit
  const totalFreteBR = libertyData?.summaryBrasil?.totalFrete ?? 0;
  const totalQuantidadeUY = libertyData?.summaryUruguay?.totalQuantidadePagos ?? 0;
  const totalFreteUY = totalQuantidadeUY * FRETE_FIXO_UY;
  const totalFrete = countryFilter === "brasil" ? totalFreteBR
    : countryFilter === "uruguay" ? totalFreteUY
    : totalFreteBR + totalFreteUY;

  // Product cost per country
  const quantidadeBR = libertyData?.summaryBrasil?.totalQuantidadePagos ?? 0;
  const quantidadeUY = libertyData?.summaryUruguay?.totalQuantidadePagos ?? 0;
  const custoProdutosBR = quantidadeBR * PRODUCT_COST.brasil;
  const custoProdutosUY = quantidadeUY * PRODUCT_COST.uruguay;
  const totalQuantidadePagos = countryFilter === "brasil" ? quantidadeBR
    : countryFilter === "uruguay" ? quantidadeUY
    : quantidadeBR + quantidadeUY;
  const custoProdutos = countryFilter === "brasil" ? custoProdutosBR
    : countryFilter === "uruguay" ? custoProdutosUY
    : custoProdutosBR + custoProdutosUY;
  const custoUnitarioLabel = countryFilter === "brasil" ? "R$ 13,00"
    : countryFilter === "uruguay" ? "R$ 5,00"
    : "misto";

  // Salários: filter by country
  const totalSalariosFixos = useMemo(() => {
    return expenses.filter(e => {
      if (e.type !== "fixa") return false;
      if (countryFilter === "todos") return true;
      const expCountry = (e as any).country;
      return !expCountry || expCountry === countryFilter || expCountry === "ambos";
    }).reduce((s, e) => s + e.amount, 0);
  }, [expenses, countryFilter]);

  const diasPeriodo = Math.max(1, Math.round((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const custoDiarias = (totalSalariosFixos / 30) * diasPeriodo;

  // Saque Brasil: (Cartão + Boleto) - 5% taxa - Frete
  const saqueBRCalc = Math.max(0, (libertyData?.summaryBrasil?.totalPagoCartao ?? 0 + (libertyData?.summaryBrasil?.totalPagoBoleto ?? 0)) * 0.95 - totalFreteBR);
  const saqueDisponBR = manualSaqueBR !== null ? manualSaqueBR : saqueBRCalc;

  // Saque Uruguay: todo valor recebido vai para saque
  const saqueUYCalc = libertyData?.summaryUruguay?.totalPago ?? 0;
  const saqueDisponUY = manualSaqueUY !== null ? manualSaqueUY : saqueUYCalc;

  // Combined or filtered saque
  const saqueDisponivel = countryFilter === "brasil" ? saqueDisponBR
    : countryFilter === "uruguay" ? saqueDisponUY
    : saqueDisponBR + saqueDisponUY;

  // Edit cash handlers
  const handleStartEditCash = () => { setCashInput(String(currentCash)); setEditingCash(true); };
  const handleSaveCash = () => {
    const val = parseFloat(cashInput.replace(/[^\d.,\-]/g, "").replace(",", "."));
    if (!isNaN(val)) setManualCash(val);
    setEditingCash(false);
  };
  const handleCancelEditCash = () => setEditingCash(false);

  // Edit saque BR handlers
  const handleStartEditSaqueBR = () => { setSaqueBRInput(String(saqueDisponBR)); setEditingSaqueBR(true); };
  const handleSaveSaqueBR = () => {
    const val = parseFloat(saqueBRInput.replace(/[^\d.,\-]/g, "").replace(",", "."));
    if (!isNaN(val)) setManualSaqueBR(val);
    setEditingSaqueBR(false);
  };
  const handleCancelEditSaqueBR = () => setEditingSaqueBR(false);

  // Edit saque UY handlers
  const handleStartEditSaqueUY = () => { setSaqueUYInput(String(saqueDisponUY)); setEditingSaqueUY(true); };
  const handleSaveSaqueUY = () => {
    const val = parseFloat(saqueUYInput.replace(/[^\d.,\-]/g, "").replace(",", "."));
    if (!isNaN(val)) setManualSaqueUY(val);
    setEditingSaqueUY(false);
  };
  const handleCancelEditSaqueUY = () => setEditingSaqueUY(false);

  const isSingleDay = dateRange.from === dateRange.to;
  const periodLabel = isSingleDay ? formatDate(dateRange.from) : `${formatDate(dateRange.from)} — ${formatDate(dateRange.to)}`;

  const adsSpendForScenario = currentAdsData?.totalSpend ?? 0;

  return (
    <DashboardLayout title="Painel Financeiro" subtitle="Controle financeiro executivo">
      <div className="flex items-center justify-between mb-6">
        <DateFilter />
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await queryClient.invalidateQueries({ queryKey: ["liberty-data"] });
              await queryClient.invalidateQueries({ queryKey: ["ads-spend"] });
              setIsRefreshing(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
            title="Atualizar dados"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </button>
          <AddExpenseDialog />
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <KPICard label="Receita em Caixa + Saque" value={currentCash + saqueDisponivel} prefix="R$" icon={DollarSign} index={0} variant="positive" />
        
        {/* Caixa */}
        {editingCash ? (
          <div className="glass-card p-4 flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Receita em Caixa</span>
            <div className="flex items-center gap-2">
              <Input type="text" value={cashInput} onChange={e => setCashInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSaveCash(); if (e.key === "Escape") handleCancelEditCash(); }}
                className="h-8 text-sm font-mono" autoFocus placeholder="Ex: 150000" />
              <button onClick={handleSaveCash} className="text-chart-positive hover:opacity-80"><Check className="h-4 w-4" /></button>
              <button onClick={handleCancelEditCash} className="text-destructive hover:opacity-80"><X className="h-4 w-4" /></button>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <KPICard label="Receita em Caixa" value={currentCash} prefix="R$" icon={Wallet} index={0} variant="positive" />
            <button onClick={handleStartEditCash} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted" title="Editar valor manualmente">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        <KPICard label="Total a Pagar + Agendadas" value={totalPayableWithScheduled} prefix="R$" icon={Landmark} index={1} variant="negative" />
        <KPICard label="Saldo (Caixa - Obrigações)" value={currentCash - totalPayableWithScheduled} prefix="R$" icon={Target} index={2} variant={(currentCash - totalPayableWithScheduled) >= 0 ? "positive" : "negative"} />

        {/* Saque - shows per country or combined */}
        {countryFilter === "todos" ? (
          <div className="glass-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Saque Disponível</p>
            <p className="text-xl font-bold font-mono text-foreground mb-2">{formatCurrency(saqueDisponivel)}</p>
            <div className="space-y-1 border-t border-border/50 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">🇧🇷 Brasil</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono font-semibold text-foreground">{formatCurrency(saqueDisponBR)}</span>
                  {!editingSaqueBR && (
                    <button onClick={handleStartEditSaqueBR} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted">
                      <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">🇺🇾 Uruguay</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono font-semibold text-foreground">{formatCurrency(saqueDisponUY)}</span>
                  {!editingSaqueUY && (
                    <button onClick={handleStartEditSaqueUY} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted">
                      <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : countryFilter === "brasil" ? (
          editingSaqueBR ? (
            <div className="glass-card p-4 flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Saque 🇧🇷 Brasil</span>
              <div className="flex items-center gap-2">
                <Input type="text" value={saqueBRInput} onChange={e => setSaqueBRInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveSaqueBR(); if (e.key === "Escape") handleCancelEditSaqueBR(); }}
                  className="h-8 text-sm font-mono" autoFocus />
                <button onClick={handleSaveSaqueBR} className="text-chart-positive hover:opacity-80"><Check className="h-4 w-4" /></button>
                <button onClick={handleCancelEditSaqueBR} className="text-destructive hover:opacity-80"><X className="h-4 w-4" /></button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <KPICard label="Saque 🇧🇷 Brasil" value={saqueDisponBR} prefix="R$" icon={Banknote} index={3} variant="positive" />
              <button onClick={handleStartEditSaqueBR} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )
        ) : (
          editingSaqueUY ? (
            <div className="glass-card p-4 flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Saque 🇺🇾 Uruguay</span>
              <div className="flex items-center gap-2">
                <Input type="text" value={saqueUYInput} onChange={e => setSaqueUYInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveSaqueUY(); if (e.key === "Escape") handleCancelEditSaqueUY(); }}
                  className="h-8 text-sm font-mono" autoFocus />
                <button onClick={handleSaveSaqueUY} className="text-chart-positive hover:opacity-80"><Check className="h-4 w-4" /></button>
                <button onClick={handleCancelEditSaqueUY} className="text-destructive hover:opacity-80"><X className="h-4 w-4" /></button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <KPICard label="Saque 🇺🇾 Uruguay" value={saqueDisponUY} prefix="R$" icon={Banknote} index={3} variant="positive" />
              <button onClick={handleStartEditSaqueUY} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )
        )}
      </div>

      {/* Receita */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <KPICard label="Receita Total (Faturamento)" value={summary?.totalValor ?? 0} prefix="R$" icon={DollarSign} index={0} />
        <KPICard label="Receita Já Recebida" value={totalReceived} prefix="R$" icon={Wallet} index={1} variant="positive" />
      </div>

      {/* Cenários de Pagamento */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Projeção de Receita — Cenários de Pagamento
          {countryFilter !== "todos" && (
            <span className="ml-2 text-primary">
              {countryFilter === "brasil" ? "🇧🇷 Brasil" : "🇺🇾 Uruguay"}
            </span>
          )}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ScenarioCard percentage={100} totalReceivable={totalReceivable} totalExpenses={totalExpensesPeriod} adsSpend={adsSpendForScenario} shippingCost={totalFrete} productCost={custoProdutos} dailySalaryCost={custoDiarias} index={0} />
          <ScenarioCard percentage={70} totalReceivable={totalReceivable} totalExpenses={totalExpensesPeriod} adsSpend={adsSpendForScenario} shippingCost={totalFrete} productCost={custoProdutos} dailySalaryCost={custoDiarias} index={1} highlight />
          <ScenarioCard percentage={60} totalReceivable={totalReceivable} totalExpenses={totalExpensesPeriod} adsSpend={adsSpendForScenario} shippingCost={totalFrete} productCost={custoProdutos} dailySalaryCost={custoDiarias} index={2} />
          <ScenarioCard percentage={50} totalReceivable={totalReceivable} totalExpenses={totalExpensesPeriod} adsSpend={adsSpendForScenario} shippingCost={totalFrete} productCost={custoProdutos} dailySalaryCost={custoDiarias} index={3} />
        </div>
      </div>

      {/* Period Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard label={`Entradas (${periodLabel})`} value={periodIncome + totalRecebidoCartaoBoleto} prefix="R$" icon={ArrowUpRight} index={0} variant="positive" />
        <KPICard label={`Saídas (${periodLabel})`} value={periodOut + totalFrete} prefix="R$" icon={ArrowDownRight} index={1} variant="negative" />
        <KPICard label={`Lucro Líquido (${isSingleDay ? "Dia" : "Período"})`} value={periodGrossProfit * 0.85} prefix="R$" icon={TrendingUp} index={2} variant={periodGrossProfit >= 0 ? "positive" : "negative"} />
        <div className="cfo-card p-5 accent-amber">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Custo Produtos</p>
            <div className="icon-box icon-box-amber"><Package size={18} /></div>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-foreground">{formatCurrency(custoProdutos)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {countryFilter === "todos"
              ? `${quantidadeBR} un × R$13 (BR) + ${quantidadeUY} un × R$5 (UY)`
              : `${totalQuantidadePagos} un × ${custoUnitarioLabel}`
            }
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Fluxo Diário</h3>
          <p className="text-xs text-muted-foreground mb-4">Entradas vs Saídas — {periodLabel}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={periodDailyEntries.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 18%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => new Date(v + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 20%, 11%)", border: "1px solid hsl(222, 15%, 18%)", borderRadius: "8px", fontSize: "11px" }}
                formatter={(value: number) => [formatCurrency(value), ""]}
                labelFormatter={(v) => new Date(v + "T12:00:00").toLocaleDateString("pt-BR")} />
              <Bar dataKey="totalIn" name="Entradas" fill="hsl(152, 60%, 48%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="totalOut" name="Saídas" fill="hsl(0, 72%, 55%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Evolução Mensal</h3>
          <p className="text-xs text-muted-foreground mb-4">Receita · Despesa · Lucro</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyFlowData}>
              <defs>
                <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152, 60%, 48%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 15%, 18%)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 20%, 11%)", border: "1px solid hsl(222, 15%, 18%)", borderRadius: "8px", fontSize: "11px" }}
                formatter={(value: number) => [formatCurrency(value), ""]} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
              <Area type="monotone" dataKey="receita" name="Receita" stroke="hsl(152, 60%, 48%)" strokeWidth={2} fill="url(#gradR)" />
              <Area type="monotone" dataKey="despesa" name="Despesa" stroke="hsl(0, 72%, 55%)" strokeWidth={2} fill="url(#gradD)" />
              <Area type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(40, 90%, 58%)" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Custos do Período</h3>
          <p className="text-xs text-muted-foreground mb-4">{periodLabel}</p>
          <div className="space-y-2">
            {periodExpenses.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Nenhum custo registrado neste período.</p>
            )}
            {periodExpenses.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-xs font-medium text-foreground">{e.description}</p>
                  <p className="text-[10px] text-muted-foreground">{e.category} · {formatDate(e.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-chart-negative">{formatCurrency(e.amount)}</p>
                  <Badge variant={e.status === "pago" ? "default" : "secondary"} className="text-[9px] mt-0.5">{e.status}</Badge>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border flex justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total do Período</span>
              <span className="text-xs font-mono font-bold text-foreground">{formatCurrency(totalExpensesPeriod)}</span>
            </div>
          </div>
        </div>

        <ExpensePieChart />

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Capital em Giro — A Receber</h3>
          <p className="text-xs text-muted-foreground mb-4">Top clientes pendentes (LibertyPainel)</p>
          <div className="space-y-2">
            {libertyLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
            ) : pedidos.filter(p => p.status_pagamento === "pendente").slice(0, 6).map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-xs font-medium text-foreground">{p.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{p.produto} · {p.pais === "brasil" ? "🇧🇷" : p.pais === "uruguay" ? "🇺🇾" : p.pais}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-chart-info">{formatCurrency(p.valor)}</p>
                  <Badge variant="secondary" className="text-[9px] mt-0.5">{p.status_pagamento}</Badge>
                </div>
              </div>
            ))}
            {!libertyLoading && pedidos.filter(p => p.status_pagamento === "pendente").length === 0 && (
              <p className="text-xs text-muted-foreground italic">Nenhum pedido pendente.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
