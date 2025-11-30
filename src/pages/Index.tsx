import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Ticket } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="space-y-6">
          <img
            src="https://s3.guicheweb.com.br/nova_marca/logogw_preta.png"
            alt="Guichê Web Logo"
            className="w-32 h-32 mx-auto"
          />
          <p className="text-xl md:text-2xl text-muted-foreground">
            Seu portal de vendas de ingressos
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => navigate("/ahh-verao-henrique-e-juliano-nattan")}
          className="text-lg px-10 py-7 bg-green-500 hover:bg-green-600 text-white rounded-md font-semibold"
        >
          <Ticket className="mr-2 h-5 w-5" />
          Ver Ingressos Disponíveis
        </Button>
      </div>
    </div>
  );
};

export default Index;
