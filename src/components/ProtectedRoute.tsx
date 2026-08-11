import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  country?: "brasil" | "uruguay" | "paraguay" | "caixarel";
}

export function ProtectedRoute({ children, country }: Props) {
  const { user, loading, countryAccess } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Acesso restrito a um país: qualquer rota de outro país (ou global) redireciona
  if (countryAccess && country !== countryAccess) {
    return <Navigate to={`/${countryAccess}`} replace />;
  }

  return <>{children}</>;
}
