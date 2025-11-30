import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Search, Home } from "lucide-react";
import guichewebLogo from "@/assets/guicheweb-logo.png";
import guichewebLogoFull from "@/assets/guicheweb-logo-full.png";

interface EventData {
  name: string;
  location: string;
  date: string;
  time: string;
  openingTime?: string;
  coverUrl?: string;
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { transactionId?: string; eventData?: EventData } | null;
  const transactionId = state?.transactionId;
  const eventData = state?.eventData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <img src={guichewebLogo} alt="Guichê Web" className="h-8" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Pagamento Aprovado!
          </h1>
          <p className="text-gray-600 mb-6">
            Sua compra foi realizada com sucesso.
          </p>

          {transactionId && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Número da transação:</p>
              <p className="font-mono font-bold text-gray-800">{transactionId}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-green-800 mb-3">
              Como acessar seus ingressos:
            </h3>
            <ol className="space-y-2 text-sm text-green-700">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Clique no botão abaixo para ver seus ingressos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Ou acesse a página inicial do site e abra o menu</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Clique em "Buscar Pedidos" e digite seu CPF ou e-mail</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/meus-pedidos', { state: { fromPayment: true, transactionId, eventData } })}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
            >
              <Search className="h-5 w-5 mr-2" />
              Ver Meus Ingressos
            </Button>

            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full py-6 text-lg border-gray-300 text-gray-700"
            >
              <Home className="h-5 w-5 mr-2" />
              Voltar para Início
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center mb-2">
            <img src={guichewebLogoFull} alt="Guichê Web" className="h-8" />
          </div>
          <p>Todos os direitos reservados</p>
          <p className="mt-1">Ambiente seguro para pagamento</p>
        </div>
      </footer>
    </div>
  );
};

export default PaymentSuccess;
