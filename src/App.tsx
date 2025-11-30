import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Ingressos from "./pages/Ingressos";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import MeusDados from "./pages/MeusDados";
import MeusPedidos from "./pages/MeusPedidos";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/ahh-verao-henrique-e-juliano-nattan" element={<Ingressos />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pagamento-aprovado" element={<PaymentSuccess />} />
            <Route path="/ingressos" element={<Navigate to="/ahh-verao-henrique-e-juliano-nattan" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/meus-dados" element={<MeusDados />} />
            <Route path="/meus-pedidos" element={<MeusPedidos />} />
            <Route path="/gw-admin-2025" element={<AdminLogin />} />
            <Route path="/gw-admin-2025/dashboard" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
