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
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  DollarSign, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight,
  Landmark, Target, Pencil, Check, X, Banknote, Package, RefreshCw, ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React, { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

// Product cost per unit by country
const PRODUCT_COST = { brasil: 13, uruguay: 5 };
// Fixed shipping for Uruguay per unit
const FRETE_FIXO_UY = 35;

interface IndexProps {
  country?: "brasil" | "uruguay";
}

const Index = ({ country }: IndexProps = {}) => {
  const {
    selectedDate, dateRange, expenses, countryFilter, setCountryFilter,
    manualCash, setManualCash,
    manualCashBR, setManualCashBR,
    manualCashUY, setManualCashUY,
    manualSaqueBR, setManualSaqueBR,
    manualSaqueUY, setManualSaqueUY,
  } = useFinance();

  // Sync country prop to context filter
  React.useEffect(() => {
    if (country) {
      setCountryFilter(country);
    } else {
      setCountryFilter("todos");
    }
  }, [country, setCountryFilter]);
  const { data: libertyData, isLoading: libertyLoading } = useLibertyData(dateRange.from, dateRange.to);
  const { data: libertyDataTotal } = useLibertyData();
  const { data: adsData, isLoading: adsLoading } = useAdsSpend(dateRange.from, dateRange.to);
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingCash, setEditingCash] = useState(false);
  const [cashInput, setCashInput] = useState("");
  const [editingCashBR, setEditingCashBR] = useState(false);
  const [cashBRInput, setCashBRInput] = useState("");
  const [editingCashUY, setEditingCashUY] = useState(false);
  const [cashUYInput, setCashUYInput] = useState("");
  const [editingSaqueBR, setEditingSaqueBR] = useState(false);
  const [saqueBRInput, setSaqueBRInput] = useState("");
  const [editingSaqueUY, setEditingSaqueUY] = useState(false);
  const [expandPayable, setExpandPayable] = useState(false);
  const [expandEntradas, setExpandEntradas] = useState(false);
  const [expandSaidas, setExpandSaidas] = useState(false);
  const [saqueUYInput, setSaqueUYInput] = useState("");

  // Select summary based on country filter
  const summary = useMemo(() => {
    if (!libertyData) return undefined;
    if (countryFilter === "brasil") return libertyData.summaryBrasil;
    if (countryFilter === "uruguay") return libertyData.summaryUruguay;
    return libertyData.summary;
  }, [libertyData, countryFilter]);

  // Summary total (sem filtro de data) para Receita Total e Receita Recebida
  const summaryTotal = useMemo(() => {
    if (!libertyDataTotal) return undefined;
    if (countryFilter === "brasil") return libertyDataTotal.summaryBrasil;
    if (countryFilter === "uruguay") return libertyDataTotal.summaryUruguay;
    return libertyDataTotal.summary;
  }, [libertyDataTotal, countryFilter]);

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

  // Load manual revenues
  const { data: manualRevenues = [] } = useQuery({
    queryKey: ["revenues", countryFilter],
    queryFn: async () => {
      let query = supabase.from("revenues").select("*").order("created_at", { ascending: false });
      if (countryFilter === "brasil") query = query.eq("country", "brasil");
      else if (countryFilter === "uruguay") query = query.eq("country", "uruguay");
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const manualRevTotal = useMemo(() => manualRevenues.reduce((s, r) => s + Number(r.amount), 0), [manualRevenues]);
  const manualRevPago = useMemo(() => manualRevenues.filter(r => r.status === "pago").reduce((s, r) => s + Number(r.amount), 0), [manualRevenues]);
  const manualRevPendente = useMemo(() => manualRevenues.filter(r => r.status === "pendente").reduce((s, r) => s + Number(r.amount), 0), [manualRevenues]);

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
  const manualExpensesPago = periodExpenses.filter(e => e.status === "pago" && !e.isAutoGenerated).reduce((s, e) => s + e.amount, 0);

  const totalReceivable = (summary?.totalPendente ?? 0) + manualRevPendente;
  const totalReceived = (summary?.totalPago ?? 0) + manualRevPago;
  const totalRecebidoPix = summary?.totalPagoPix ?? 0;
  const totalRecebidoCartaoBoleto = (summary?.totalPagoCartao ?? 0) + (summary?.totalPagoBoleto ?? 0);

  const totalPayable = getTotalAccountsPayable();
  const pendingExpensesList = useMemo(() => expenses.filter(e => e.status === "pendente"), [expenses]);
  const scheduledExpensesList = useMemo(() => expenses.filter(e => e.status === "agendado"), [expenses]);
  const totalPendingExpenses = pendingExpensesList.reduce((s, e) => s + e.amount, 0);
  const scheduledExpensesTotal = scheduledExpensesList.reduce((s, e) => s + e.amount, 0);
  const totalPayableWithScheduled = totalPendingExpenses + scheduledExpensesTotal;
  const currentCashBR = manualCashBR ?? 0;
  const currentCashUY = manualCashUY ?? 0;
  const currentCash = countryFilter === "brasil" ? currentCashBR
    : countryFilter === "uruguay" ? currentCashUY
    : (manualCash !== null ? manualCash : currentCashBR + currentCashUY);

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

  // Edit cash handlers (combined - "todos" view)
  const handleStartEditCash = () => { setCashInput(String(currentCash)); setEditingCash(true); };
  const handleSaveCash = () => {
    const val = parseFloat(cashInput.replace(/[^\d.,\-]/g, "").replace(",", "."));
    if (!isNaN(val)) setManualCash(val);
    setEditingCash(false);
  };
  const handleCancelEditCash = () => setEditingCash(false);

  // Edit cash BR handlers
  const handleStartEditCashBR = () => { setCashBRInput(String(currentCashBR)); setEditingCashBR(true); };
  const handleSaveCashBR = () => {
    const val = parseFloat(cashBRInput.replace(/[^\d.,\-]/g, "").replace(",", "."));
    if (!isNaN(val)) setManualCashBR(val);
    setEditingCashBR(false);
  };
  const handleCancelEditCashBR = () => setEditingCashBR(false);

  // Edit cash UY handlers
  const handleStartEditCashUY = () => { setCashUYInput(String(currentCashUY)); setEditingCashUY(true); };
  const handleSaveCashUY = () => {
    const val = parseFloat(cashUYInput.replace(/[^\d.,\-]/g, "").replace(",", "."));
    if (!isNaN(val)) setManualCashUY(val);
    setEditingCashUY(false);
  };
  const handleCancelEditCashUY = () => setEditingCashUY(false);

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
    <DashboardLayout title={country === "brasil" ? "🇧🇷 Brasil" : country === "uruguay" ? "🇺🇾 Uruguay" : "Painel Financeiro"} subtitle={country ? "Controle financeiro" : "Controle financeiro executivo"} hideCountryFilter={!!country}>
      <div className="flex items-center justify-between mb-6">
        <DateFilter />
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await queryClient.invalidateQueries({ queryKey: ["liberty-data"] });
              await queryClient.invalidateQueries({ queryKey: ["ads-spend"] });
              await queryClient.invalidateQueries({ queryKey: ["revenues"] });
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
        <KPICard label="Receita em Caixa + Saque" value={currentCash + saqueDisponivel + manualRevPago} prefix="R$" icon={DollarSign} index={0} variant="positive" />
        
        {/* Caixa — per country or combined */}
        {countryFilter === "todos" ? (
          editingCash ? (
            <div className="glass-card p-4 flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Receita em Caixa (Geral)</span>
              <div className="flex items-center gap-2">
                <Input type="text" value={cashInput} onChange={e => setCashInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveCash(); if (e.key === "Escape") handleCancelEditCash(); }}
                  className="h-8 text-sm font-mono" autoFocus placeholder="Ex: 150000" />
                <button onClick={handleSaveCash} className="text-chart-positive hover:opacity-80"><Check className="h-4 w-4" /></button>
                <button onClick={handleCancelEditCash} className="text-destructive hover:opacity-80"><X className="h-4 w-4" /></button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-4 group relative">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Receita em Caixa</p>
              <p className="text-xl font-bold font-mono text-foreground mb-2">{formatCurrency(currentCash)}</p>
              <div className="space-y-1 border-t border-border/50 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">🇧🇷 Brasil</span>
                  {editingCashBR ? (
                    <div className="flex items-center gap-1">
                      <Input type="text" value={cashBRInput} onChange={e => setCashBRInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleSaveCashBR(); if (e.key === "Escape") handleCancelEditCashBR(); }}
                        className="h-6 w-24 text-xs font-mono" autoFocus />
                      <button onClick={handleSaveCashBR} className="text-chart-positive hover:opacity-80"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={handleCancelEditCashBR} className="text-destructive hover:opacity-80"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono font-semibold text-foreground">{formatCurrency(currentCashBR)}</span>
                      <button onClick={handleStartEditCashBR} className="p-0.5 rounded hover:bg-muted">
                        <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">🇺🇾 Uruguay</span>
                  {editingCashUY ? (
                    <div className="flex items-center gap-1">
                      <Input type="text" value={cashUYInput} onChange={e => setCashUYInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleSaveCashUY(); if (e.key === "Escape") handleCancelEditCashUY(); }}
                        className="h-6 w-24 text-xs font-mono" autoFocus />
                      <button onClick={handleSaveCashUY} className="text-chart-positive hover:opacity-80"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={handleCancelEditCashUY} className="text-destructive hover:opacity-80"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono font-semibold text-foreground">{formatCurrency(currentCashUY)}</span>
                      <button onClick={handleStartEditCashUY} className="p-0.5 rounded hover:bg-muted">
                        <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ) : countryFilter === "brasil" ? (
          editingCashBR ? (
            <div className="glass-card p-4 flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Receita em Caixa 🇧🇷</span>
              <div className="flex items-center gap-2">
                <Input type="text" value={cashBRInput} onChange={e => setCashBRInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveCashBR(); if (e.key === "Escape") handleCancelEditCashBR(); }}
                  className="h-8 text-sm font-mono" autoFocus />
                <button onClick={handleSaveCashBR} className="text-chart-positive hover:opacity-80"><Check className="h-4 w-4" /></button>
                <button onClick={handleCancelEditCashBR} className="text-destructive hover:opacity-80"><X className="h-4 w-4" /></button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <KPICard label="Receita em Caixa 🇧🇷" value={currentCashBR} prefix="R$" icon={Wallet} index={0} variant="positive" />
              <button onClick={handleStartEditCashBR} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )
        ) : (
          editingCashUY ? (
            <div className="glass-card p-4 flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Receita em Caixa 🇺🇾</span>
              <div className="flex items-center gap-2">
                <Input type="text" value={cashUYInput} onChange={e => setCashUYInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveCashUY(); if (e.key === "Escape") handleCancelEditCashUY(); }}
                  className="h-8 text-sm font-mono" autoFocus />
                <button onClick={handleSaveCashUY} className="text-chart-positive hover:opacity-80"><Check className="h-4 w-4" /></button>
                <button onClick={handleCancelEditCashUY} className="text-destructive hover:opacity-80"><X className="h-4 w-4" /></button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <KPICard label="Receita em Caixa 🇺🇾" value={currentCashUY} prefix="R$" icon={Wallet} index={0} variant="positive" />
              <button onClick={handleStartEditCashUY} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )
        )}

        {/* Total a Pagar + Agendadas — Expandable */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="cfo-card p-5 group accent-red cursor-pointer"
          onClick={() => setExpandPayable(prev => !prev)}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total a Pagar + Agendadas</p>
            <div className="icon-box icon-box-red">
              <Landmark size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-chart-negative">{formatCurrency(totalPayableWithScheduled)}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expandPayable ? "rotate-180" : ""}`} />
            <span className="text-[10px] text-muted-foreground">
              {pendingExpensesList.length + scheduledExpensesList.length} itens · clique para detalhes
            </span>
          </div>
          {expandPayable && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5 max-h-48 overflow-y-auto">
              {pendingExpensesList.length > 0 && (
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pendentes</p>
              )}
              {pendingExpensesList.map(e => (
                <div key={e.id} className="flex justify-between items-center">
                  <span className="text-[10px] text-foreground truncate max-w-[60%]">{e.description}</span>
                  <span className="text-[10px] font-mono font-semibold text-chart-negative">{formatCurrency(e.amount)}</span>
                </div>
              ))}
              {scheduledExpensesList.length > 0 && (
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-2">Agendadas</p>
              )}
              {scheduledExpensesList.map(e => (
                <div key={e.id} className="flex justify-between items-center">
                  <span className="text-[10px] text-foreground truncate max-w-[60%]">{e.description}</span>
                  <span className="text-[10px] font-mono font-semibold text-chart-warning">{formatCurrency(e.amount)}</span>
                </div>
              ))}
              {pendingExpensesList.length === 0 && scheduledExpensesList.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">Nenhum débito pendente ou agendado.</p>
              )}
            </div>
          )}
        </motion.div>
        <KPICard label="Saldo (Caixa - Obrigações)" value={currentCash - totalPayableWithScheduled} prefix="R$" icon={Target} index={2} variant={(currentCash - totalPayableWithScheduled) >= 0 ? "positive" : "negative"} />

        {/* Saque - shows per country or combined */}
        {countryFilter === "todos" ? (
          <div className="glass-card p-4 group">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Saque Disponível</p>
            <p className="text-xl font-bold font-mono text-foreground mb-2">{formatCurrency(saqueDisponivel)}</p>
            <div className="space-y-1 border-t border-border/50 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">🇧🇷 Brasil</span>
                {editingSaqueBR ? (
                  <div className="flex items-center gap-1">
                    <Input type="text" value={saqueBRInput} onChange={e => setSaqueBRInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSaveSaqueBR(); if (e.key === "Escape") handleCancelEditSaqueBR(); }}
                      className="h-6 w-24 text-xs font-mono" autoFocus />
                    <button onClick={handleSaveSaqueBR} className="text-chart-positive hover:opacity-80"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={handleCancelEditSaqueBR} className="text-destructive hover:opacity-80"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono font-semibold text-foreground">{formatCurrency(saqueDisponBR)}</span>
                    <button onClick={handleStartEditSaqueBR} className="p-0.5 rounded hover:bg-muted">
                      <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">🇺🇾 Uruguay</span>
                {editingSaqueUY ? (
                  <div className="flex items-center gap-1">
                    <Input type="text" value={saqueUYInput} onChange={e => setSaqueUYInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSaveSaqueUY(); if (e.key === "Escape") handleCancelEditSaqueUY(); }}
                      className="h-6 w-24 text-xs font-mono" autoFocus />
                    <button onClick={handleSaveSaqueUY} className="text-chart-positive hover:opacity-80"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={handleCancelEditSaqueUY} className="text-destructive hover:opacity-80"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono font-semibold text-foreground">{formatCurrency(saqueDisponUY)}</span>
                    <button onClick={handleStartEditSaqueUY} className="p-0.5 rounded hover:bg-muted">
                      <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
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

      {/* Receita — Período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <KPICard label={`Total Recebido (${periodLabel})`} value={summary?.totalPago ?? 0} prefix="R$" icon={Wallet} index={0} variant="positive" />
        <KPICard label="Receita Total — Período Total" value={(summaryTotal?.totalValor ?? 0) + manualRevTotal} prefix="R$" icon={DollarSign} index={1} />
        <KPICard label="Receita Já Recebida — Período Total" value={(summaryTotal?.totalPago ?? 0) + manualRevPago} prefix="R$" icon={Wallet} index={2} variant="positive" />
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
          <ScenarioCard percentage={100} totalReceivable={totalReceivable} totalExpenses={totalExpensesPeriod} adsSpend={adsSpendForScenario} shippingCost={totalFrete} shippingCount={totalQuantidadePagos} productCost={custoProdutos} productCount={totalQuantidadePagos} dailySalaryCost={custoDiarias} index={0} />
          <ScenarioCard percentage={70} totalReceivable={totalReceivable} totalExpenses={totalExpensesPeriod} adsSpend={adsSpendForScenario} shippingCost={totalFrete} shippingCount={totalQuantidadePagos} productCost={custoProdutos} productCount={totalQuantidadePagos} dailySalaryCost={custoDiarias} index={1} highlight />
          <ScenarioCard percentage={60} totalReceivable={totalReceivable} totalExpenses={totalExpensesPeriod} adsSpend={adsSpendForScenario} shippingCost={totalFrete} shippingCount={totalQuantidadePagos} productCost={custoProdutos} productCount={totalQuantidadePagos} dailySalaryCost={custoDiarias} index={2} />
          <ScenarioCard percentage={50} totalReceivable={totalReceivable} totalExpenses={totalExpensesPeriod} adsSpend={adsSpendForScenario} shippingCost={totalFrete} shippingCount={totalQuantidadePagos} productCost={custoProdutos} productCount={totalQuantidadePagos} dailySalaryCost={custoDiarias} index={3} />
        </div>
      </div>

      {/* Period Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">

        {/* Entradas expandível */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="cfo-card p-5 group accent-green cursor-pointer"
          onClick={() => setExpandEntradas(prev => !prev)}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Entradas ({periodLabel})</p>
            <div className="icon-box icon-box-green">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-chart-positive">
            {formatCurrency(periodIncome + totalRecebidoCartaoBoleto + manualRevPago)}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expandEntradas ? "rotate-180" : ""}`} />
            <span className="text-[10px] text-muted-foreground">clique para detalhes</span>
          </div>
          {expandEntradas && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5 max-h-64 overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Breakdown por forma de pagamento */}
              <div className="space-y-1 mb-2">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Formas de Recebimento</p>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-foreground">PIX</span>
                  <span className="text-[10px] font-mono font-semibold text-chart-positive">{formatCurrency(totalRecebidoPix)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-foreground">Cartão + Boleto</span>
                  <span className="text-[10px] font-mono font-semibold text-chart-positive">{formatCurrency(totalRecebidoCartaoBoleto)}</span>
                </div>
                {manualRevPago > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-foreground">Receitas Manuais</span>
                    <span className="text-[10px] font-mono font-semibold text-chart-positive">{formatCurrency(manualRevPago)}</span>
                  </div>
                )}
              </div>
              {/* Pedidos pagos */}
              {pedidos.filter(p => p.status_pagamento === "pago").length > 0 && (
                <>
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mt-2">Pedidos Recebidos</p>
                  {pedidos.filter(p => p.status_pagamento === "pago").slice(0, 20).map(p => (
                    <div key={p.id} className="flex justify-between items-center gap-2">
                      <span className="text-[10px] text-foreground truncate max-w-[55%]">{p.nome}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-muted-foreground">{(p.forma_pagamento || "–").toUpperCase()}</span>
                        <span className="text-[10px] font-mono font-semibold text-chart-positive">{formatCurrency(p.valor)}</span>
                      </div>
                    </div>
                  ))}
                  {pedidos.filter(p => p.status_pagamento === "pago").length > 20 && (
                    <p className="text-[9px] text-muted-foreground italic text-center pt-1">
                      + {pedidos.filter(p => p.status_pagamento === "pago").length - 20} pedidos
                    </p>
                  )}
                </>
              )}
              {/* Receitas manuais pagas */}
              {manualRevenues.filter(r => r.status === "pago").length > 0 && (
                <>
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mt-2">Receitas Manuais</p>
                  {manualRevenues.filter(r => r.status === "pago").map(r => (
                    <div key={r.id} className="flex justify-between items-center">
                      <span className="text-[10px] text-foreground truncate max-w-[60%]">{r.description}</span>
                      <span className="text-[10px] font-mono font-semibold text-chart-positive">{formatCurrency(Number(r.amount))}</span>
                    </div>
                  ))}
                </>
              )}
              {pedidos.filter(p => p.status_pagamento === "pago").length === 0 && manualRevPago === 0 && (
                <p className="text-[10px] text-muted-foreground italic">Nenhuma entrada no período.</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Saídas expandível */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="cfo-card p-5 group accent-red cursor-pointer"
          onClick={() => setExpandSaidas(prev => !prev)}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Saídas ({periodLabel})</p>
            <div className="icon-box icon-box-red">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-chart-negative">
            {formatCurrency(periodOut + totalFrete + manualExpensesPago)}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expandSaidas ? "rotate-180" : ""}`} />
            <span className="text-[10px] text-muted-foreground">clique para detalhes</span>
          </div>
          {expandSaidas && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5 max-h-64 overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Breakdown geral */}
              <div className="space-y-1 mb-2">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Resumo</p>
                {totalFrete > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-foreground">Frete</span>
                    <span className="text-[10px] font-mono font-semibold text-chart-negative">{formatCurrency(totalFrete)}</span>
                  </div>
                )}
                {manualExpensesPago > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-foreground">Despesas Pagas</span>
                    <span className="text-[10px] font-mono font-semibold text-chart-negative">{formatCurrency(manualExpensesPago)}</span>
                  </div>
                )}
              </div>
              {/* Lista de despesas pagas */}
              {periodExpenses.filter(e => e.status === "pago" && !e.isAutoGenerated).length > 0 && (
                <>
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mt-2">Despesas Pagas</p>
                  {periodExpenses.filter(e => e.status === "pago" && !e.isAutoGenerated).map(e => (
                    <div key={e.id} className="flex justify-between items-center gap-2">
                      <span className="text-[10px] text-foreground truncate max-w-[60%]">{e.description}</span>
                      <span className="text-[10px] font-mono font-semibold text-chart-negative">{formatCurrency(e.amount)}</span>
                    </div>
                  ))}
                </>
              )}
              {periodOut === 0 && totalFrete === 0 && manualExpensesPago === 0 && (
                <p className="text-[10px] text-muted-foreground italic">Nenhuma saída no período.</p>
              )}
            </div>
          )}
        </motion.div>

        <KPICard label={`Lucro Líquido (${isSingleDay ? "Dia" : "Período"})`} value={periodGrossProfit * 0.85} prefix="R$" icon={TrendingUp} index={2} variant={periodGrossProfit >= 0 ? "positive" : "negative"} />
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
