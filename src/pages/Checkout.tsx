import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Check, ArrowRight, QrCode, Copy, Clock } from "lucide-react";
import eventCover from "@/assets/event-cover.jpg";

interface CartItem {
  id: string;
  name: string;
  section: string;
  variant: string;
  price: number;
  fee: number;
  quantity: number;
}

interface CheckoutState {
  items: CartItem[];
  total: number;
  totalWithFees: number;
}

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState<'personal' | 'payment' | 'pix'>('personal');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    celular: ''
  });
  
  // PIX state
  const [pixData, setPixData] = useState<{
    qrCode: string;
    copiaCola: string;
    expiresAt: Date | null;
  }>({
    qrCode: '',
    copiaCola: '',
    expiresAt: null
  });

  // Get cart data from navigation state
  const checkoutState = location.state as CheckoutState | null;

  useEffect(() => {
    if (!checkoutState || !checkoutState.items || checkoutState.items.length === 0) {
      toast.error("Carrinho vazio");
      navigate('/ahh-verao-henrique-e-juliano-nattan');
    }
  }, [checkoutState, navigate]);

  if (!checkoutState) {
    return null;
  }

  const { items, total, totalWithFees } = checkoutState;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'cpf') {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length <= 11) {
        setFormData(prev => ({ ...prev, cpf: formatCPF(numbers) }));
      }
    } else if (field === 'celular') {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length <= 11) {
        setFormData(prev => ({ ...prev, celular: formatPhone(numbers) }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validatePersonalData = () => {
    if (!formData.nome.trim()) {
      toast.error("Digite seu nome completo");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error("Digite um e-mail válido");
      return false;
    }
    const cpfNumbers = formData.cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      toast.error("CPF deve ter 11 dígitos");
      return false;
    }
    const phoneNumbers = formData.celular.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
      toast.error("Digite um número de celular válido");
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (step === 'personal') {
      if (validatePersonalData()) {
        setStep('payment');
      }
    }
  };

  const handleGeneratePix = async () => {
    setIsLoading(true);
    
    // Simulate PIX generation (will be replaced with FreePay API)
    setTimeout(() => {
      const mockPixCode = `00020126580014br.gov.bcb.pix0136${Date.now()}520400005303986540${totalWithFees.toFixed(2)}5802BR5925AHHHVERAO INGRESSOS6009SAO PAULO62140510${Date.now()}6304`;
      
      setPixData({
        qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(mockPixCode),
        copiaCola: mockPixCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      });
      
      setStep('pix');
      setIsLoading(false);
    }, 1500);
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixData.copiaCola);
    toast.success("Código PIX copiado!");
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalFees = () => {
    return items.reduce((sum, item) => sum + (item.fee * item.quantity), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <img 
              src={eventCover} 
              alt="Ahh Verão" 
              className="h-10 w-10 rounded object-cover mr-3"
            />
            <span className="text-xl font-bold text-gray-900">Ahh Verão - Checkout Seguro</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Data Section */}
              <div className={`bg-white rounded-lg shadow-sm border ${step === 'personal' ? 'border-green-500' : 'border-gray-200'}`}>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step !== 'personal' && formData.nome ? 'bg-green-500 text-white' : 'bg-gray-800 text-white'}`}>
                      {step !== 'personal' && formData.nome ? <Check className="h-5 w-5" /> : '1'}
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 uppercase">Dados Pessoais</h2>
                  </div>
                  
                  {step === 'personal' ? (
                    <>
                      <p className="text-sm text-gray-600 mb-6">
                        Pedimos apenas as informações essenciais para concluir sua compra com <span className="text-green-600 font-medium">segurança</span>.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nome" className="text-gray-700 font-medium">Nome completo</Label>
                          <Input
                            id="nome"
                            placeholder="Ex: Mariana Cardoso Silva"
                            value={formData.nome}
                            onChange={(e) => handleInputChange('nome', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="email" className="text-gray-700 font-medium">E-mail</Label>
                          <div className="relative">
                            <Input
                              id="email"
                              type="email"
                              placeholder="ex: marianacardoso@gmail.com"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="mt-1"
                            />
                            {formData.email.includes('@') && formData.email.includes('.') && (
                              <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 mt-0.5" />
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="cpf" className="text-gray-700 font-medium">CPF</Label>
                          <Input
                            id="cpf"
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={(e) => handleInputChange('cpf', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="celular" className="text-gray-700 font-medium">Celular/Whatsapp</Label>
                          <div className="flex gap-2 mt-1">
                            <div className="flex items-center px-3 bg-gray-100 rounded-md border border-gray-200">
                              <span className="text-gray-600">+55</span>
                            </div>
                            <Input
                              id="celular"
                              placeholder="(00) 00000-0000"
                              value={formData.celular}
                              onChange={(e) => handleInputChange('celular', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleContinue}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
                        >
                          CONTINUAR
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <p><strong>Nome:</strong> {formData.nome}</p>
                      <p><strong>E-mail:</strong> {formData.email}</p>
                      <p><strong>CPF:</strong> {formData.cpf}</p>
                      <p><strong>Celular:</strong> +55 {formData.celular}</p>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-green-600"
                        onClick={() => setStep('personal')}
                      >
                        Editar dados
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Section */}
              <div className={`bg-white rounded-lg shadow-sm border ${step === 'payment' || step === 'pix' ? 'border-green-500' : 'border-gray-200'}`}>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'pix' ? 'bg-green-500 text-white' : step === 'payment' ? 'bg-gray-800 text-white' : 'bg-gray-300 text-gray-500'}`}>
                      {step === 'pix' ? <Check className="h-5 w-5" /> : '2'}
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 uppercase">Opção de Pagamento</h2>
                  </div>
                  
                  {step === 'personal' ? (
                    <p className="text-sm text-gray-400">
                      Preencha suas informações de entrega para continuar
                    </p>
                  ) : step === 'payment' ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 mb-4">Selecione a forma de pagamento</p>
                      
                      <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <QrCode className="h-6 w-6 text-green-600" />
                            <span className="font-semibold text-gray-800">PIX</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 ml-9">
                          Pagamento instantâneo via QR Code ou código copia e cola
                        </p>
                      </div>
                      
                      <Button 
                        onClick={handleGeneratePix}
                        disabled={isLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg"
                      >
                        {isLoading ? 'GERANDO PIX...' : 'GERAR PIX'}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full mb-4">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">PIX válido por 15 minutos</span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          Valor: {formatCurrency(totalWithFees)}
                        </h3>
                        
                        {/* QR Code */}
                        <div className="flex justify-center my-6">
                          <div className="bg-white p-4 rounded-lg shadow-md border">
                            <img 
                              src={pixData.qrCode} 
                              alt="QR Code PIX" 
                              className="w-48 h-48"
                            />
                          </div>
                        </div>
                        
                        {/* Copy and Paste Code */}
                        <div className="bg-gray-100 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-2">Ou copie o código PIX:</p>
                          <div className="flex gap-2">
                            <Input 
                              value={pixData.copiaCola} 
                              readOnly 
                              className="bg-white text-xs"
                            />
                            <Button 
                              onClick={copyPixCode}
                              variant="outline"
                              className="shrink-0"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-6 text-sm text-gray-600">
                          <p className="font-medium mb-2">Como pagar:</p>
                          <ol className="text-left list-decimal list-inside space-y-1">
                            <li>Abra o app do seu banco</li>
                            <li>Escolha pagar via PIX</li>
                            <li>Escaneie o QR Code ou cole o código</li>
                            <li>Confirme o pagamento</li>
                          </ol>
                        </div>
                        
                        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-green-800">
                            Após a confirmação do pagamento, você receberá seu ingresso no e-mail cadastrado.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Resumo do pedido</h3>
                  
                  <Separator className="mb-4" />
                  
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800">{formatCurrency(total)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Taxa de serviço</span>
                    <span className="text-gray-800">{formatCurrency(getTotalFees())}</span>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between font-bold text-lg mb-6">
                    <span className="text-gray-800">Total</span>
                    <span className="text-gray-800">{formatCurrency(totalWithFees)}</span>
                  </div>
                  
                  {/* Cart Items */}
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-3">
                        <img 
                          src={eventCover} 
                          alt={item.name}
                          className="w-16 h-16 rounded object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-800">
                            {item.section} - {item.variant}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {item.quantity}x {formatCurrency(item.price + item.fee)}
                          </p>
                          <p className="text-sm font-medium text-gray-800">
                            {formatCurrency((item.price + item.fee) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>Ahh Verão - Todos os direitos reservados</p>
          <p className="mt-1">Ambiente seguro para pagamento</p>
        </div>
      </footer>
    </div>
  );
};

export default Checkout;
