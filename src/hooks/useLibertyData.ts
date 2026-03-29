import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LibertyPedido {
  id: string;
  nome: string;
  produto: string;
  valor: number;
  quantidade: number;
  status_pagamento: string;
  data_entrada: string;
  data_pagamento: string | null;
  pais: string;
  vendedor: string | null;
  departamento: string;
  cidade: string;
  forma_pagamento?: string;
}

export interface LibertySummary {
  total: number;
  totalValor: number;
  totalPago: number;
  totalPendente: number;
  totalCancelado: number;
  countPagos: number;
  countPendentes: number;
  countCancelados: number;
  totalPagoPix: number;
  totalPagoCartao: number;
  totalPagoBoleto: number;
  countPagosPix: number;
  countPagosCartao: number;
  countPagosBoleto: number;
  totalFrete: number;
  totalQuantidadePagos: number;
}

interface LibertyResponse {
  pedidos: LibertyPedido[];
  summary: LibertySummary;
}

export function useLibertyData(from?: string, to?: string) {
  return useQuery<LibertyResponse>({
    queryKey: ["liberty-data", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-liberty-data", {
        body: { from, to },
      });
      if (error) throw error;
      return data as LibertyResponse;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}
