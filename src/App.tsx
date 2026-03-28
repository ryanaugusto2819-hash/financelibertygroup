import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FinanceProvider } from "@/context/FinanceContext";
import Index from "./pages/Index";
import Receivables from "./pages/Receivables";
import DailyControl from "./pages/DailyControl";
import Expenses from "./pages/Expenses";
import AccountsPayable from "./pages/AccountsPayable";
import Projections from "./pages/Projections";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FinanceProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/recebiveis" element={<Receivables />} />
            <Route path="/controle-diario" element={<DailyControl />} />
            <Route path="/despesas" element={<Expenses />} />
            <Route path="/contas-pagar" element={<AccountsPayable />} />
            <Route path="/projecoes" element={<Projections />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FinanceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
