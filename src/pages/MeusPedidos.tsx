import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Clock } from "lucide-react";

const MeusPedidos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/manifesto-musical-maracana-lote-extra")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Meus Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-16 w-16 text-yellow-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Processando seus ingressos
              </h3>
              <p className="text-gray-600 max-w-md">
                Seus ingressos estão sendo processados, aguarde um instante.
                Você receberá uma confirmação em breve.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MeusPedidos;
