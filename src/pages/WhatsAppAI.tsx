import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Bot, Brain, CheckCircle2, ChevronRight, Clock, MessageCircle, Phone, Play, Plus, RefreshCw, Settings, Trash2, TrendingUp, Wifi, Zap } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useZAPIConfig,
  useUpsertZAPIConfig,
  useCampaignConfigs,
  useUpsertCampaignConfig,
  useDeleteCampaignConfig,
  useAITrainingData,
  useUpsertTrainingData,
  useDeleteTrainingData,
  useOptimizationSuggestions,
  useWhatsAppConversations,
  useAIAnalysisLogs,
  useRunCampaignMonitor,
  useSendTestMessage,
  type CampaignConfig,
  type AITrainingData,
  type ZAPIConfig,
} from "@/hooks/useWhatsAppAI";

// ─── Status helpers ───────────────────────────────────────────

const statusConfig = {
  pending:  { label: "Pendente",  color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  approved: { label: "Aprovado",  color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  applied:  { label: "Aplicado",  color: "bg-green-500/10 text-green-600 border-green-200" },
  rejected: { label: "Rejeitado", color: "bg-red-500/10 text-red-600 border-red-200" },
  expired:  { label: "Expirado",  color: "bg-gray-500/10 text-gray-500 border-gray-200" },
  error:    { label: "Erro",      color: "bg-red-500/10 text-red-600 border-red-200" },
} as const;

const suggestionTypeLabels: Record<string, string> = {
  budget_increase: "Aumento de Orçamento",
  budget_decrease: "Redução de Orçamento",
  pause:           "Pausar Campanha",
  resume:          "Retomar Campanha",
  creative_rotate: "Rotação de Criativo",
  audience_adjust: "Ajuste de Público",
  schedule_adjust: "Ajuste de Horário",
};

const trainingTypeLabels: Record<string, string> = {
  rule:    "Regra",
  example: "Exemplo",
  context: "Contexto",
  persona: "Persona",
};

const trainingCategoryLabels: Record<string, string> = {
  budget:      "Orçamento",
  performance: "Performance",
  audience:    "Público",
  creative:    "Criativo",
  general:     "Geral",
  persona:     "Persona",
};

// ─── Main Page ────────────────────────────────────────────────

export default function WhatsAppAI() {
  return (
    <DashboardLayout title="Liberty AI — WhatsApp" subtitle="IA que monitora campanhas e sugere otimizações via WhatsApp" hideCountryFilter>
      <div className="flex flex-col gap-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-11">
            <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />Dashboard
            </TabsTrigger>
            <TabsTrigger value="campanhas" className="gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5" />Campanhas
            </TabsTrigger>
            <TabsTrigger value="treinamento" className="gap-1.5 text-xs">
              <Brain className="w-3.5 h-3.5" />Treinamento
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5 text-xs">
              <MessageCircle className="w-3.5 h-3.5" />Histórico
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="gap-1.5 text-xs">
              <Settings className="w-3.5 h-3.5" />Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6"><DashboardTab /></TabsContent>
          <TabsContent value="campanhas"   className="mt-6"><CampanhasTab /></TabsContent>
          <TabsContent value="treinamento" className="mt-6"><TreinamentoTab /></TabsContent>
          <TabsContent value="historico"   className="mt-6"><HistoricoTab /></TabsContent>
          <TabsContent value="configuracoes" className="mt-6"><ConfiguracoesTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}


// ─── Tab: Dashboard ───────────────────────────────────────────

function DashboardTab() {
  const { data: suggestions = [] } = useOptimizationSuggestions();
  const { data: conversations = [] } = useWhatsAppConversations();
  const { data: campaigns = [] } = useCampaignConfigs();
  const { data: logs = [] } = useAIAnalysisLogs();
  const runMonitor = useRunCampaignMonitor();

  const pending  = suggestions.filter(s => s.status === "pending");
  const applied  = suggestions.filter(s => s.status === "applied");
  const rejected = suggestions.filter(s => s.status === "rejected");
  const totalMessages = conversations.length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">{pending.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/10">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Aplicadas</p>
                <p className="text-3xl font-bold text-green-600">{applied.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Campanhas Ativas</p>
                <p className="text-3xl font-bold">{campaigns.filter(c => c.monitoring_enabled).length}</p>
              </div>
              <Zap className="w-8 h-8 text-primary opacity-40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Mensagens Trocadas</p>
                <p className="text-3xl font-bold">{totalMessages}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-primary opacity-40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Run Monitor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="w-4 h-4 text-green-500" />
              Executar Análise Agora
            </CardTitle>
            <CardDescription>Aciona a IA para analisar todas as campanhas ativas imediatamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full gap-2"
              onClick={() => runMonitor.mutate({})}
              disabled={runMonitor.isPending}
            >
              {runMonitor.isPending ? (
                <><RefreshCw className="w-4 h-4 animate-spin" />Analisando...</>
              ) : (
                <><Bot className="w-4 h-4" />Analisar Campanhas</>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => runMonitor.mutate({ force: true })}
              disabled={runMonitor.isPending}
            >
              <RefreshCw className="w-4 h-4" />Forçar (ignorar pendentes)
            </Button>
          </CardContent>
        </Card>

        {/* Pending Suggestions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Sugestões Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sugestão aguardando resposta.</p>
            ) : (
              <div className="space-y-2">
                {pending.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{s.campaign_configs?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{suggestionTypeLabels[s.suggestion_type] || s.suggestion_type}</p>
                    </div>
                    <div className="text-right">
                      {s.current_value != null && s.suggested_value != null && (
                        <p className="text-xs font-mono">
                          R$ {s.current_value} → R$ {s.suggested_value}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(s.created_at), { locale: ptBR, addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Últimas Análises da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma análise executada ainda.</p>
          ) : (
            <div className="space-y-2">
              {logs.slice(0, 8).map(log => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border text-sm">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.error ? "bg-red-500" : "bg-green-500"}`} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{log.campaign_configs?.name || "—"}</span>
                    <span className="text-muted-foreground ml-2">{log.analysis_type === "scheduled_check" ? "automático" : "manual"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {log.tokens_used ? `${log.tokens_used} tokens` : ""}
                    {log.duration_ms ? ` · ${log.duration_ms}ms` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(log.created_at), { locale: ptBR, addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Campanhas ───────────────────────────────────────────

function CampanhasTab() {
  const { data: campaigns = [], isLoading } = useCampaignConfigs();
  const upsert = useUpsertCampaignConfig();
  const deleteCampaign = useDeleteCampaignConfig();
  const runMonitor = useRunCampaignMonitor();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<CampaignConfig> | null>(null);

  const emptyForm: Partial<CampaignConfig> = {
    name: "", campaign_id: "", adset_id: "", country: "brasil",
    budget_current: 0, budget_min: 0, budget_max: 1000,
    target_roas: undefined, target_cpa: undefined, target_ctr: undefined,
    monitoring_enabled: true, monitoring_interval: 60, auto_apply: false,
  };

  const [form, setForm] = useState<Partial<CampaignConfig>>(emptyForm);

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(c: CampaignConfig) { setEditing(c); setForm(c); setOpen(true); }

  async function handleSave() {
    await upsert.mutateAsync(form as CampaignConfig);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Campanhas Monitoradas</h2>
          <p className="text-sm text-muted-foreground">Configure as campanhas que a IA deve monitorar e otimizar.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />Nova Campanha
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Carregando...</div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Zap className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhuma campanha configurada.</p>
            <Button onClick={openNew} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />Adicionar primeira campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {campaigns.map(c => (
            <Card key={c.id} className={c.monitoring_enabled ? "" : "opacity-60"}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {c.campaign_id ? `ID: ${c.campaign_id}` : "Sem ID de campanha"} · {c.country === "brasil" ? "🇧🇷 Brasil" : c.country === "uruguay" ? "🇺🇾 Uruguay" : "🌐 Global"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={c.monitoring_enabled ? "text-green-600 border-green-200 bg-green-50" : "text-gray-500"}>
                    {c.monitoring_enabled ? "Ativo" : "Pausado"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">Orçamento</p>
                    <p className="text-sm font-semibold">R$ {c.budget_current}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">ROAS Alvo</p>
                    <p className="text-sm font-semibold">{c.target_roas ? `${c.target_roas}x` : "—"}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">CPA Alvo</p>
                    <p className="text-sm font-semibold">{c.target_cpa ? `R$ ${c.target_cpa}` : "—"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Verificar a cada {c.monitoring_interval}min</span>
                  <span>Auto-aplicar: {c.auto_apply ? "Sim" : "Não"}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openEdit(c)}>
                    <Settings className="w-3.5 h-3.5" />Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() => runMonitor.mutate({ campaign_id: c.id, force: true })}
                    disabled={runMonitor.isPending}
                  >
                    <Play className="w-3.5 h-3.5" />Analisar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteCampaign.mutate(c.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Campaign Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome da Campanha *</Label>
                <Input placeholder="Ex: Black Friday Brasil" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>ID Campanha (Facebook)</Label>
                <Input placeholder="123456789" value={form.campaign_id || ""} onChange={e => setForm(f => ({ ...f, campaign_id: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>ID AdSet (opcional)</Label>
                <Input placeholder="987654321" value={form.adset_id || ""} onChange={e => setForm(f => ({ ...f, adset_id: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>País</Label>
                <Select value={form.country || "brasil"} onValueChange={v => setForm(f => ({ ...f, country: v as CampaignConfig["country"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brasil">🇧🇷 Brasil</SelectItem>
                    <SelectItem value="uruguay">🇺🇾 Uruguay</SelectItem>
                    <SelectItem value="global">🌐 Global</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Intervalo de Monitoramento (min)</Label>
                <Input type="number" value={form.monitoring_interval || 60} onChange={e => setForm(f => ({ ...f, monitoring_interval: parseInt(e.target.value) }))} />
              </div>
            </div>

            <Separator />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Orçamento</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Atual (R$)</Label>
                <Input type="number" value={form.budget_current || 0} onChange={e => setForm(f => ({ ...f, budget_current: parseFloat(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Mínimo (R$)</Label>
                <Input type="number" value={form.budget_min || 0} onChange={e => setForm(f => ({ ...f, budget_min: parseFloat(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Máximo (R$)</Label>
                <Input type="number" value={form.budget_max || 1000} onChange={e => setForm(f => ({ ...f, budget_max: parseFloat(e.target.value) }))} />
              </div>
            </div>

            <Separator />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Metas de Performance</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>ROAS Alvo</Label>
                <Input type="number" step="0.1" placeholder="2.5" value={form.target_roas ?? ""} onChange={e => setForm(f => ({ ...f, target_roas: e.target.value ? parseFloat(e.target.value) : undefined }))} />
              </div>
              <div className="space-y-1.5">
                <Label>CPA Alvo (R$)</Label>
                <Input type="number" placeholder="50.00" value={form.target_cpa ?? ""} onChange={e => setForm(f => ({ ...f, target_cpa: e.target.value ? parseFloat(e.target.value) : undefined }))} />
              </div>
              <div className="space-y-1.5">
                <Label>CTR Alvo (%)</Label>
                <Input type="number" step="0.1" placeholder="2.0" value={form.target_ctr ?? ""} onChange={e => setForm(f => ({ ...f, target_ctr: e.target.value ? parseFloat(e.target.value) : undefined }))} />
              </div>
            </div>

            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Monitoramento Ativo</Label>
                  <p className="text-xs text-muted-foreground">A IA vai monitorar e sugerir otimizações</p>
                </div>
                <Switch checked={form.monitoring_enabled ?? true} onCheckedChange={v => setForm(f => ({ ...f, monitoring_enabled: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Aplicar</Label>
                  <p className="text-xs text-muted-foreground">Aplica otimizações sem aguardar confirmação</p>
                </div>
                <Switch checked={form.auto_apply ?? false} onCheckedChange={v => setForm(f => ({ ...f, auto_apply: v }))} />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSave} disabled={upsert.isPending || !form.name}>
                {upsert.isPending ? "Salvando..." : "Salvar Campanha"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: Treinamento ─────────────────────────────────────────

function TreinamentoTab() {
  const { data: training = [], isLoading } = useAITrainingData();
  const upsert = useUpsertTrainingData();
  const deleteItem = useDeleteTrainingData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AITrainingData> | null>(null);

  const emptyForm: Partial<AITrainingData> = {
    type: "rule", category: "budget", title: "", content: "", priority: 5, is_active: true,
  };
  const [form, setForm] = useState<Partial<AITrainingData>>(emptyForm);

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(item: AITrainingData) { setEditing(item); setForm(item); setOpen(true); }

  const grouped = training.reduce((acc, item) => {
    const key = item.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, AITrainingData[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Centro de Treinamento da IA</h2>
          <p className="text-sm text-muted-foreground">Defina regras, exemplos e contextos que guiam as decisões da IA.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />Adicionar Dado
        </Button>
      </div>

      {/* Training tips */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10">
        <CardContent className="py-3 px-4">
          <div className="flex gap-3">
            <Brain className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-medium">Como treinar a IA</p>
              <p className="text-xs">• <b>Regra:</b> "Se ROAS {'>'} 3x por 2 dias, aumentar orçamento em 25%"</p>
              <p className="text-xs">• <b>Contexto:</b> "Nossa margem líquida é 40%, então CPA máximo aceitável é R$ 60"</p>
              <p className="text-xs">• <b>Exemplo:</b> Mensagem de WhatsApp que a IA deve usar como referência</p>
              <p className="text-xs">• <b>Persona:</b> Como a IA deve se comportar e se comunicar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="space-y-6">
          {(["persona", "rule", "context", "example"] as AITrainingData["type"][]).map(type => {
            const items = grouped[type] || [];
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold">{trainingTypeLabels[type]}</h3>
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground pl-2">Nenhum dado deste tipo.</p>
                ) : (
                  <div className="space-y-2">
                    {items.map(item => (
                      <Card key={item.id} className={`transition-opacity ${item.is_active ? "" : "opacity-50"}`}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium truncate">{item.title}</p>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                                  {trainingCategoryLabels[item.category] || item.category}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground flex-shrink-0">P:{item.priority}</span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">{item.content}</p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(item)}>
                                <Settings className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteItem.mutate(item.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Training Data Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Dado" : "Novo Dado de Treinamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.type || "rule"} onValueChange={v => setForm(f => ({ ...f, type: v as AITrainingData["type"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rule">Regra</SelectItem>
                    <SelectItem value="context">Contexto</SelectItem>
                    <SelectItem value="example">Exemplo</SelectItem>
                    <SelectItem value="persona">Persona</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoria *</Label>
                <Select value={form.category || "general"} onValueChange={v => setForm(f => ({ ...f, category: v as AITrainingData["category"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Orçamento</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="audience">Público</SelectItem>
                    <SelectItem value="creative">Criativo</SelectItem>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="persona">Persona</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input placeholder="Ex: Regra de Aumento de Orçamento" value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Conteúdo *</Label>
              <Textarea
                placeholder="Descreva a regra, contexto ou exemplo em detalhes..."
                rows={6}
                value={form.content || ""}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prioridade (1–10)</Label>
                <Input type="number" min={1} max={10} value={form.priority || 5} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active ?? true} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Ativo</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={async () => { await upsert.mutateAsync(form as AITrainingData); setOpen(false); }}
                disabled={upsert.isPending || !form.title || !form.content}>
                {upsert.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: Histórico ───────────────────────────────────────────

function HistoricoTab() {
  const { data: suggestions = [] } = useOptimizationSuggestions();
  const { data: conversations = [] } = useWhatsAppConversations();
  const [activeView, setActiveView] = useState<"suggestions" | "chat">("suggestions");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant={activeView === "suggestions" ? "default" : "outline"} size="sm" onClick={() => setActiveView("suggestions")}>
          Sugestões
        </Button>
        <Button variant={activeView === "chat" ? "default" : "outline"} size="sm" onClick={() => setActiveView("chat")}>
          Conversas WhatsApp
        </Button>
      </div>

      {activeView === "suggestions" ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico de Sugestões</CardTitle>
            <CardDescription>Todas as otimizações sugeridas pela IA.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {suggestions.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">Nenhuma sugestão ainda.</p>
              ) : (
                <div className="divide-y">
                  {suggestions.map(s => {
                    const cfg = statusConfig[s.status as keyof typeof statusConfig] || statusConfig.pending;
                    return (
                      <div key={s.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{s.campaign_configs?.name || "—"}</p>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.color}`}>
                                {cfg.label}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {suggestionTypeLabels[s.suggestion_type] || s.suggestion_type}
                              </Badge>
                            </div>
                            {s.current_value != null && s.suggested_value != null && (
                              <p className="text-xs font-mono text-muted-foreground mb-1">
                                R$ {s.current_value} → R$ {s.suggested_value}
                                {s.change_percent != null && ` (${s.change_percent > 0 ? "+" : ""}${s.change_percent.toFixed(1)}%)`}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground line-clamp-2">{s.reasoning}</p>
                          </div>
                          <div className="text-xs text-muted-foreground flex-shrink-0 text-right">
                            <p>{format(new Date(s.created_at), "dd/MM HH:mm", { locale: ptBR })}</p>
                            {s.applied_at && <p className="text-green-600">Aplicado</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              Conversas WhatsApp
            </CardTitle>
            <CardDescription>Histórico de mensagens trocadas entre você e a IA.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {conversations.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">Nenhuma conversa ainda.</p>
              ) : (
                <div className="p-4 space-y-3">
                  {[...conversations].reverse().map(msg => (
                    <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.direction === "outbound"
                          ? "bg-green-500 text-white rounded-tr-sm"
                          : "bg-muted rounded-tl-sm"
                      }`}>
                        <p className="whitespace-pre-wrap text-xs leading-relaxed">{msg.message}</p>
                        <div className={`flex items-center gap-1 mt-1 ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                          <span className={`text-[10px] ${msg.direction === "outbound" ? "text-green-100" : "text-muted-foreground"}`}>
                            {format(new Date(msg.created_at), "HH:mm")}
                          </span>
                          {msg.intent && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                              {msg.intent}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab: Configurações ───────────────────────────────────────

function ConfiguracoesTab() {
  const { data: zapiConfig } = useZAPIConfig();
  const upsert = useUpsertZAPIConfig();
  const sendTest = useSendTestMessage();

  const [form, setForm] = useState<Partial<ZAPIConfig>>({
    instance_id: "",
    token: "",
    client_token: "",
    phone: "",
    is_active: true,
    webhook_configured: false,
  });

  const [initialized, setInitialized] = useState(false);
  if (zapiConfig && !initialized) {
    setForm(zapiConfig);
    setInitialized(true);
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const webhookUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/whatsapp-webhook` : "Configure VITE_SUPABASE_URL";

  async function handleSave() {
    await upsert.mutateAsync(form as ZAPIConfig);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Z-API Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-green-500" />
            Configuração Z-API
          </CardTitle>
          <CardDescription>
            Configure sua instância Z-API para enviar e receber mensagens WhatsApp.{" "}
            <a href="https://z-api.io" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              z-api.io
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Instance ID *</Label>
              <Input
                placeholder="Ex: 3C9B8A7..."
                value={form.instance_id || ""}
                onChange={e => setForm(f => ({ ...f, instance_id: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Encontrado no painel Z-API</p>
            </div>
            <div className="space-y-1.5">
              <Label>Token *</Label>
              <Input
                type="password"
                placeholder="Token da instância"
                value={form.token || ""}
                onChange={e => setForm(f => ({ ...f, token: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Client Token (opcional)</Label>
              <Input
                type="password"
                placeholder="Security Token"
                value={form.client_token || ""}
                onChange={e => setForm(f => ({ ...f, client_token: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Em Segurança no painel Z-API</p>
            </div>
            <div className="space-y-1.5">
              <Label>Seu Número WhatsApp *</Label>
              <Input
                placeholder="5511999999999"
                value={form.phone || ""}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Com código do país, sem + ou espaços</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Conexão Ativa</Label>
              <p className="text-xs text-muted-foreground">Ativa/desativa o envio de mensagens</p>
            </div>
            <Switch checked={form.is_active ?? true} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? "Salvando..." : "Salvar Configuração"}
            </Button>
            <Button
              variant="outline"
              onClick={() => sendTest.mutate("🤖 *Liberty AI* conectada com sucesso! Estou pronta para monitorar suas campanhas.")}
              disabled={sendTest.isPending || !zapiConfig}
            >
              <Wifi className="w-4 h-4 mr-1.5" />
              Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            Configuração do Webhook
          </CardTitle>
          <CardDescription>
            Configure esta URL no painel Z-API para receber as respostas do WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>URL do Webhook (copie e cole no Z-API)</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs bg-muted" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => { navigator.clipboard.writeText(webhookUrl); }}
              >
                Copiar
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-medium">Como configurar no Z-API:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Acesse o painel Z-API e selecione sua instância</li>
              <li>Vá em <b>Webhooks</b> → <b>Webhook de Recebimento</b></li>
              <li>Cole a URL acima no campo de webhook</li>
              <li>Ative o webhook e salve</li>
              <li>Envie uma mensagem de teste pelo WhatsApp para verificar</li>
            </ol>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${zapiConfig?.webhook_configured ? "bg-green-500" : "bg-yellow-500"}`} />
            <p className="text-sm text-muted-foreground">
              Status: {zapiConfig?.webhook_configured ? "Webhook configurado" : "Aguardando configuração"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              onClick={() => upsert.mutate({ ...form, webhook_configured: true } as ZAPIConfig)}
            >
              Marcar como configurado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
            Chave de API Anthropic (Claude)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            A IA utiliza o modelo Claude para analisar campanhas e interpretar suas respostas no WhatsApp.
            Configure a chave nos segredos do Supabase:
          </p>
          <div className="rounded-lg bg-amber-100/50 dark:bg-amber-900/20 p-3 font-mono text-xs">
            <p className="text-amber-800 dark:text-amber-200">supabase secrets set ANTHROPIC_API_KEY=sk-ant-...</p>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Acesse: Supabase Dashboard → Edge Functions → Manage secrets
          </p>
        </CardContent>
      </Card>

      {/* CRON Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Agendamento Automático
          </CardTitle>
          <CardDescription>Configure para a IA analisar campanhas automaticamente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Para automatizar as análises, use um serviço de CRON para chamar a função <code className="bg-muted px-1 rounded text-xs">campaign-monitor</code> periodicamente.
          </p>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium">Opção 1: pg_cron (Supabase)</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{`SELECT cron.schedule(
  'liberty-ai-monitor',
  '0 */2 * * *',  -- a cada 2 horas
  $$
    SELECT net.http_post(
      url := '${supabaseUrl}/functions/v1/campaign-monitor',
      headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
    )
  $$
);`}</pre>
            <Separator />
            <p className="text-sm font-medium">Opção 2: cron-job.org (gratuito)</p>
            <p className="text-xs text-muted-foreground">
              1. Acesse cron-job.org e crie uma conta gratuita<br />
              2. Crie um novo job com a URL: <code className="bg-muted px-1 rounded">{supabaseUrl}/functions/v1/campaign-monitor</code><br />
              3. Adicione o header: <code className="bg-muted px-1 rounded">Authorization: Bearer SERVICE_ROLE_KEY</code><br />
              4. Configure o intervalo desejado (ex: a cada hora)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
