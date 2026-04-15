import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FinanceProvider } from "@/context/FinanceContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Receivables from "./pages/Receivables";
import Expenses from "./pages/Expenses";
import Projections from "./pages/Projections";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <FinanceProvider>
          <BrowserRouter>
            <Routes>
              {/* Público */}
              <Route path="/login" element={<Login />} />

              {/* Protegidos */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/brasil" element={<ProtectedRoute country="brasil"><Index country="brasil" /></ProtectedRoute>} />
              <Route path="/uruguay" element={<ProtectedRoute country="uruguay"><Index country="uruguay" /></ProtectedRoute>} />

              <Route path="/recebiveis" element={<ProtectedRoute><Receivables /></ProtectedRoute>} />
              <Route path="/brasil/recebiveis" element={<ProtectedRoute country="brasil"><Receivables country="brasil" /></ProtectedRoute>} />
              <Route path="/uruguay/recebiveis" element={<ProtectedRoute country="uruguay"><Receivables country="uruguay" /></ProtectedRoute>} />

              <Route path="/despesas" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
              <Route path="/brasil/despesas" element={<ProtectedRoute country="brasil"><Expenses country="brasil" /></ProtectedRoute>} />
              <Route path="/uruguay/despesas" element={<ProtectedRoute country="uruguay"><Expenses country="uruguay" /></ProtectedRoute>} />

              <Route path="/projecoes" element={<ProtectedRoute><Projections /></ProtectedRoute>} />


              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </FinanceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
