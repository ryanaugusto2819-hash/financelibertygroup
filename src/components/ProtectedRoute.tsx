import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  country?: "brasil" | "uruguay";
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

  // Se o usuário tem acesso restrito ao Uruguay e está tentando acessar Brasil → redireciona
  if (countryAccess === "uruguay" && country === "brasil") {
    return <Navigate to="/uruguay" replace />;
  }

  // Se o usuário tem acesso restrito ao Uruguay e está na raiz → redireciona para /uruguay
  if (countryAccess === "uruguay" && !country) {
    return <Navigate to="/uruguay" replace />;
  }

  return <>{children}</>;
}
