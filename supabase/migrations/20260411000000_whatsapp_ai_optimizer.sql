-- ============================================================
-- WhatsApp AI Campaign Optimizer
-- Migration: 20260411000000
-- ============================================================

-- ── Z-API Configuration ──────────────────────────────────────
CREATE TABLE public.zapi_config (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    text        NOT NULL,
  token          text        NOT NULL,
  client_token   text,
  phone          text        NOT NULL,  -- phone that receives notifications (e.g. 5511999999999)
  is_active      boolean     DEFAULT true,
  webhook_configured boolean DEFAULT false,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE public.zapi_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_zapi_config" ON public.zapi_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Campaign Configurations ───────────────────────────────────
CREATE TABLE public.campaign_configs (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text        NOT NULL,
  campaign_id          text,                        -- Facebook Ads campaign ID
  adset_id             text,                        -- Facebook Ads adset ID
  country              text        DEFAULT 'brasil' CHECK (country IN ('brasil', 'uruguay', 'global')),
  budget_current       numeric     DEFAULT 0,
  budget_min           numeric     DEFAULT 0,       -- AI won't go below this
  budget_max           numeric     DEFAULT 1000,    -- AI won't exceed this
  target_roas          numeric,
  target_cpa           numeric,
  target_ctr           numeric,
  monitoring_enabled   boolean     DEFAULT true,
  monitoring_interval  integer     DEFAULT 60,      -- minutes between checks
  auto_apply           boolean     DEFAULT false,   -- apply without asking
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE public.campaign_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_campaign_configs" ON public.campaign_configs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── AI Training Data ──────────────────────────────────────────
CREATE TABLE public.ai_training_data (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text        NOT NULL CHECK (type IN ('rule', 'example', 'context', 'persona')),
  category    text        NOT NULL DEFAULT 'general'
                          CHECK (category IN ('budget', 'performance', 'audience', 'creative', 'general', 'persona')),
  title       text        NOT NULL,
  content     text        NOT NULL,
  priority    integer     DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  tags        text[]      DEFAULT '{}',
  is_active   boolean     DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_ai_training_data" ON public.ai_training_data
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Optimization Suggestions ──────────────────────────────────
CREATE TABLE public.optimization_suggestions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_config_id   uuid        REFERENCES public.campaign_configs(id) ON DELETE SET NULL,
  suggestion_type      text        NOT NULL
                       CHECK (suggestion_type IN (
                         'budget_increase', 'budget_decrease',
                         'pause', 'resume',
                         'audience_adjust', 'creative_rotate', 'schedule_adjust'
                       )),
  current_value        numeric,
  suggested_value      numeric,
  change_percent       numeric,
  reasoning            text        NOT NULL,
  metrics_snapshot     jsonb       DEFAULT '{}',
  status               text        DEFAULT 'pending'
                       CHECK (status IN ('pending', 'approved', 'rejected', 'applied', 'expired', 'error')),
  whatsapp_message_id  text,
  applied_at           timestamptz,
  error_message        text,
  created_at           timestamptz DEFAULT now(),
  expires_at           timestamptz DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.optimization_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_optimization_suggestions" ON public.optimization_suggestions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── WhatsApp Conversations ────────────────────────────────────
CREATE TABLE public.whatsapp_conversations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  direction     text        NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message       text        NOT NULL,
  message_id    text,
  phone         text,
  suggestion_id uuid        REFERENCES public.optimization_suggestions(id) ON DELETE SET NULL,
  intent        text,       -- 'approval', 'rejection', 'question', 'custom_value', 'command', 'unknown'
  processed     boolean     DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_whatsapp_conversations" ON public.whatsapp_conversations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── AI Analysis Logs ──────────────────────────────────────────
CREATE TABLE public.ai_analysis_logs (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_config_id   uuid        REFERENCES public.campaign_configs(id) ON DELETE SET NULL,
  analysis_type        text        NOT NULL,
  input_data           jsonb       DEFAULT '{}',
  output_data          jsonb       DEFAULT '{}',
  tokens_used          integer,
  duration_ms          integer,
  error                text,
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE public.ai_analysis_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_ai_analysis_logs" ON public.ai_analysis_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_zapi_config_updated_at
  BEFORE UPDATE ON public.zapi_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_campaign_configs_updated_at
  BEFORE UPDATE ON public.campaign_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_ai_training_data_updated_at
  BEFORE UPDATE ON public.ai_training_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Seed: default training data ───────────────────────────────
INSERT INTO public.ai_training_data (type, category, title, content, priority) VALUES

('persona', 'persona', 'Persona Liberty AI',
'Você é a Liberty AI, uma inteligência artificial especialista em marketing digital e otimização de campanhas no Facebook/Meta Ads. Você analisa métricas de campanhas e sugere otimizações baseadas em dados reais e nas regras de treinamento fornecidas. Você se comunica de forma clara, direta e profissional via WhatsApp. Sempre explique o raciocínio por trás das suas sugestões com dados concretos. Seja objetivo e nunca invente dados.',
10),

('rule', 'budget', 'Regra: Aumento de Orçamento',
'QUANDO: ROAS >= (meta_roas * 1.2) por pelo menos 2 dias consecutivos E gasto >= 80% do orçamento E CPA <= meta_cpa. ENTÃO: Sugira aumento de 20-30% no orçamento. LIMITE: Nunca aumente mais que 30% de uma vez e nunca acima do budget_max configurado.',
9),

('rule', 'budget', 'Regra: Redução de Orçamento',
'QUANDO: ROAS < 1.5x por 2 dias consecutivos OU CPA > (meta_cpa * 1.5). ENTÃO: Sugira redução de 20-25% no orçamento. LIMITE: Nunca reduza abaixo do budget_min configurado.',
9),

('rule', 'performance', 'Regra: CTR Baixo',
'QUANDO: CTR < 1.0% por mais de 2 dias. ENTÃO: Sugira rotação de criativo ou revisão do público-alvo. Explique que o baixo CTR pode indicar fadiga de criativo ou segmentação inadequada.',
8),

('rule', 'performance', 'Regra: Custo por Clique Alto',
'QUANDO: CPC está 50% acima da média histórica. ENTÃO: Sugira pausa e revisão da estratégia de lances ou público-alvo.',
7),

('context', 'budget', 'Contexto: Escalabilidade de Orçamento',
'Campanhas que gastam menos de 60% do orçamento disponível não devem ter orçamento aumentado — o algoritmo do Facebook já tem limite. Campanhas que atingem 95%+ do orçamento com bom desempenho têm alta probabilidade de escalar bem com aumento de budget.',
8),

('context', 'general', 'Contexto: Período de Aprendizado',
'Campanhas com menos de 50 conversões estão em período de aprendizado do Facebook. Evite fazer mudanças bruscas (>20%) durante esse período pois reinicia o aprendizado.',
7),

('example', 'budget', 'Exemplo: Mensagem de Aumento de Orçamento',
'Formato de mensagem WhatsApp para aumento:\n🤖 *Liberty AI — Oportunidade Detectada*\n\n📊 *Campanha:* [nome]\n📅 *Período analisado:* Últimas 48h\n\n*Métricas Atuais:*\n• ROAS: X.Xx (meta: X.Xx) ✅\n• CPA: R$ XX,XX (meta: R$ XX,XX) ✅\n• Gasto: R$ XX,XX / R$ XX,XX (X%)\n\n*Análise:* [explicação breve]\n\n💡 *Sugestão:* Aumentar orçamento de R$ XX para R$ XX (+X%)\n\n*Impacto esperado:* +X conversões/dia',
6),

('example', 'budget', 'Exemplo: Mensagem de Redução de Orçamento',
'Formato de mensagem WhatsApp para redução:\n⚠️ *Liberty AI — Ação Recomendada*\n\n📊 *Campanha:* [nome]\n\n*Métricas Atuais:*\n• ROAS: X.Xx (abaixo da meta de X.Xx) ❌\n• CPA: R$ XX,XX (acima do limite de R$ XX,XX) ❌\n\n*Análise:* [explicação breve do problema]\n\n💡 *Sugestão:* Reduzir orçamento de R$ XX para R$ XX (-X%) para controlar custos enquanto investigamos.',
6);
