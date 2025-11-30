import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { MapPin, Ticket, Instagram, Plus, Minus, Loader2, Youtube, Map, Info } from "lucide-react";
import { FaWhatsapp, FaFacebookF, FaFacebookMessenger, FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

interface TicketType {
  id: string;
  section: string;
  price: number;
  available: number;
  color: string;
}

const Ingressos = () => {
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartTotal, setCartTotal] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});

  const eventData = {
    name: "Ahh Verão - Henrique e Juliano + Nattan",
    date: "02/01/2026",
    time: "21:00H",
    location: "Arena Open Camboriú - CAMBORIÚ/SC",
    image: "https://images.guicheweb.com.br/imagenseventos/30-09-2024_12-08-36.jpg",
    cover: "https://images.guicheweb.com.br/imagenseventos/30-09-2024_12-04-05.jpg",
    logo: "",
    instagram: "https://www.instagram.com/gdoproducoes/",
    facebook: "https://www.facebook.com/gdoproducoes",
    mapsEmbedUrl: "https://maps.google.com/maps?q=Arena+Open+Camboriú,+Camboriú+-+SC,+Brasil&center=-27.0253,-48.6513&t=&z=15&ie=UTF8&iwloc=&output=embed"
  };

  interface TicketVariant {
    id: string;
    name: string;
    price: number;
  }

  interface TicketSector {
    id: string;
    section: string;
    description: string;
    color: string;
    available: number;
    variants: TicketVariant[];
  }

  const ticketSectors: TicketSector[] = [
    { 
      id: 'frontstage', 
      section: 'Frontstage Open Food', 
      description: 'Open Food: Massas, risotos e doces',
      color: '#FFD700', 
      available: 50,
      variants: [
        { id: 'frontstage-inteira', name: 'Inteira', price: 460 }
      ]
    },
    { 
      id: 'premium', 
      section: 'Premium Open Bar +18', 
      description: 'Open Bar de Água, cerveja, refrigerante, suco, vodka',
      color: '#9333EA', 
      available: 100,
      variants: [
        { id: 'premium-inteira', name: 'Inteira', price: 157.50 }
      ]
    },
    { 
      id: 'vip', 
      section: 'Área VIP', 
      description: 'Visão frontal do palco; Área de convivência; Banheiros no setor.',
      color: '#3B82F6', 
      available: 200,
      variants: [
        { id: 'vip-inteira', name: 'Inteira', price: 160 },
        { id: 'vip-meia', name: 'Meia', price: 80 },
        { id: 'vip-solidario', name: 'Solidário (+1KG alimento)', price: 85 }
      ]
    },
    { 
      id: 'arena', 
      section: 'Arena', 
      description: 'Visão frontal do palco; Área de convivência; Setor com menor custo.',
      color: '#22C55E', 
      available: 500,
      variants: [
        { id: 'arena-inteira', name: 'Inteira', price: 105 },
        { id: 'arena-meia', name: 'Meia', price: 52.50 },
        { id: 'arena-solidario', name: 'Solidário (+1KG alimento)', price: 57.50 },
        { id: 'arena-pcd', name: 'PCD ou Acompanhante PCD', price: 52.50 }
      ]
    }
  ];

  // For backward compatibility with cart logic
  const tickets: TicketType[] = ticketSectors.flatMap(sector => 
    sector.variants.map(variant => ({
      id: variant.id,
      section: `${sector.section} - ${variant.name}`,
      price: variant.price,
      color: sector.color,
      available: sector.available
    }))
  );

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, []);

  useEffect(() => {
    let total = 0;
    Object.entries(cart).forEach(([ticketId, quantity]) => {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        total += ticket.price * quantity;
      }
    });
    setCartTotal(total);
  }, [cart]);

  const handleShare = (platform: string) => {
    const shareUrl = window.location.href;
    const shareText = `${eventData.name} - ${eventData.date}`;

    let url = "";
    switch(platform) {
      case "WhatsApp":
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
        break;
      case "Facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "Twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const toggleSector = (ticketId: string) => {
    setExpandedSectors(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const canAddMore = () => {
    return getTotalItems() < 2;
  };

  const getSelectedCategory = () => {
    const categories = Object.keys(cart).filter(key => cart[key] > 0);
    return categories.length > 0 ? categories[0] : null;
  };

  const updateQuantity = (ticketId: string, change: number) => {
    setCart(prev => {
      const currentQty = prev[ticketId] || 0;
      const newQty = Math.max(0, currentQty + change);

      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket && newQty > ticket.available) {
        toast.error("Quantidade não disponível");
        return prev;
      }

      const selectedCategory = getSelectedCategory();
      if (change > 0 && selectedCategory && selectedCategory !== ticketId && currentQty === 0) {
        toast.error("Você pode comprar apenas uma classe de ingresso por vez", {
          description: "Remova os ingressos do carrinho para adicionar outra categoria",
          duration: 4000
        });
        return prev;
      }

      if (change > 0 && !canAddMore()) {
        toast.error("Você pode comprar no máximo 2 ingressos no total");
        return prev;
      }

      if (newQty === 0) {
        const { [ticketId]: _, ...rest } = prev;
        return rest;
      }

      if (change > 0 && currentQty === 0) {
        toast.success("Ingresso adicionado ao carrinho!");
      }

      return { ...prev, [ticketId]: newQty };
    });
  };

  const checkoutLinks: Record<string, Record<number, string>> = {
    // Links de checkout serão configurados após integração com FreePay
    'frontstage-inteira': { 1: '', 2: '' },
    'premium-inteira': { 1: '', 2: '' },
    'vip-inteira': { 1: '', 2: '' },
    'vip-meia': { 1: '', 2: '' },
    'vip-solidario': { 1: '', 2: '' },
    'arena-inteira': { 1: '', 2: '' },
    'arena-meia': { 1: '', 2: '' },
    'arena-solidario': { 1: '', 2: '' },
    'arena-pcd': { 1: '', 2: '' }
  };

  const handleCheckout = () => {
    const selectedCategory = getSelectedCategory();
    const totalQuantity = getTotalItems();

    if (!selectedCategory || totalQuantity === 0) {
      toast.error("Adicione ingressos ao carrinho");
      return;
    }

    const checkoutUrl = checkoutLinks[selectedCategory]?.[totalQuantity];

    if (!checkoutUrl || checkoutUrl === '') {
      toast.error("Link de checkout não configurado para esta seleção");
      return;
    }

    window.location.href = checkoutUrl;
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error("Digite um código de cupom");
      return;
    }
    toast.info("Cupom não encontrado");
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative">
        <div
          className="relative w-full h-[280px] md:h-[420px] bg-no-repeat bg-center mt-16"
          style={{
            backgroundImage: `url('${eventData.cover}')`,
            backgroundSize: 'cover'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-white pointer-events-none"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-20 md:-mt-24 relative z-10">
        <div className="bg-white rounded-lg shadow-2xl p-4 md:p-8 mb-8 max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
            <div className="flex justify-center lg:justify-start mb-6 lg:mb-0 lg:w-1/3">
              <div className="w-full max-w-[320px] lg:max-w-none">
                <img
                  src={eventData.image}
                  alt={eventData.name}
                  className="w-full rounded-lg shadow-md"
                />

                <div className="mt-4">
                  <p className="text-sm text-center text-gray-600 mb-3">Compartilhar</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      onClick={() => handleShare("WhatsApp")}
                      title="WhatsApp"
                    >
                      <FaWhatsapp className="h-5 w-5 text-green-600" />
                    </button>
                    <button
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      onClick={() => handleShare("Facebook")}
                      title="Facebook"
                    >
                      <FaFacebookF className="h-5 w-5 text-blue-600" />
                    </button>
                    <button
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      onClick={() => window.open(`fb-messenger://share/?link=${encodeURIComponent(window.location.href)}`, '_blank')}
                      title="Messenger"
                    >
                      <FaFacebookMessenger className="h-5 w-5 text-blue-500" />
                    </button>
                    <button
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      onClick={() => handleShare("Twitter")}
                      title="X (Twitter)"
                    >
                      <FaXTwitter className="h-5 w-5 text-gray-800" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:flex-1 space-y-4">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900">
                {eventData.name}
              </h1>

              <p className="text-xl md:text-2xl lg:text-3xl text-gray-700">
                {eventData.date} - {eventData.time}
              </p>

              <p className="text-lg lg:text-xl text-gray-600 flex items-center justify-center lg:justify-start gap-2">
                <MapPin className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" />
                <span>{eventData.location}</span>
              </p>

              <div className="pt-2 flex gap-4">
                <a
                  href={eventData.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block hover:opacity-70 transition-opacity"
                >
                  <Instagram className="h-7 w-7 lg:h-8 lg:w-8 text-gray-800" />
                </a>
                <a
                  href={eventData.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block hover:opacity-70 transition-opacity"
                >
                  <FaFacebookF className="h-7 w-7 lg:h-8 lg:w-8 text-gray-800" />
                </a>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl lg:max-w-none pt-4">
                <button
                  onClick={() => document.getElementById('ingressos')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center justify-center p-4 lg:p-5 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all"
                  title="Ingressos"
                >
                  <Ticket className="h-8 w-8 lg:h-10 lg:w-10 text-gray-700" />
                </button>

                <button
                  onClick={() => document.getElementById('localizacao')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center justify-center p-4 lg:p-5 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all"
                  title="Mapa"
                >
                  <Map className="h-8 w-8 lg:h-10 lg:w-10 text-gray-700" />
                </button>

                <button
                  onClick={() => document.getElementById('info')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center justify-center p-4 lg:p-5 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all"
                  title="Informação"
                >
                  <Info className="h-8 w-8 lg:h-10 lg:w-10 text-gray-700" />
                </button>

                <button
                  onClick={() => window.open('https://www.youtube.com', '_blank')}
                  className="flex items-center justify-center p-4 lg:p-5 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all"
                  title="Youtube"
                >
                  <Youtube className="h-8 w-8 lg:h-10 lg:w-10 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Coupon Field */}
        <div className="max-w-5xl mx-auto mb-8">
          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <h5 className="font-semibold text-lg mb-2">Possui código promocional?</h5>
                <p className="text-sm text-gray-600">
                  Insira abaixo e veja se temos algum ingresso especial pra você!
                </p>
              </div>
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  placeholder="Cupom de Desconto"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={applyCoupon}
                  variant="secondary"
                  className="px-4"
                >
                  <Ticket className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Section */}
        <div id="ingressos" className="max-w-5xl mx-auto mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                CARREGANDO SETORES <Loader2 className="h-6 w-6 animate-spin" />
              </span>
            ) : (
              "INGRESSOS"
            )}
          </h2>

          {!loading && (
            <div className="space-y-4">
              {ticketSectors.map((sector) => {
                const isExpanded = expandedSectors[sector.id];
                const lowestPrice = Math.min(...sector.variants.map(v => v.price));
                return (
                  <div
                    key={sector.id}
                    className={`shadow rounded-lg overflow-hidden transition-colors ${
                      isExpanded ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    <button
                      onClick={() => toggleSector(sector.id)}
                      className="w-full flex items-center justify-between p-4 hover:opacity-90 transition-opacity"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: sector.color }}
                        />
                        <div className="text-left">
                          <h3 className={`font-semibold text-lg ${isExpanded ? 'text-white' : 'text-gray-900'}`}>
                            {sector.section}
                          </h3>
                          <p className={`text-sm ${isExpanded ? 'text-gray-200' : 'text-gray-500'}`}>
                            {sector.description}
                          </p>
                          <p className={`text-sm font-medium ${isExpanded ? 'text-gray-200' : 'text-gray-600'}`}>
                            a partir de {formatCurrency(lowestPrice)}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xl font-bold ${isExpanded ? 'text-white' : 'text-gray-900'}`}>
                        {isExpanded ? '−' : '+'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="bg-gray-100 px-4 py-4 space-y-4">
                        {sector.variants.map((variant) => (
                          <div key={variant.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                            <div className="space-y-1 mb-3">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Ingresso:</span> {sector.section} ({variant.name})
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Lote:</span> 2. LOTE
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Valor + Taxa:</span> {formatCurrency(variant.price)} + R$ 0,00
                              </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 bg-white rounded-lg p-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-gray-100"
                                onClick={() => updateQuantity(variant.id, -1)}
                                disabled={!cart[variant.id] || cart[variant.id] === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center font-bold text-gray-900">
                                {cart[variant.id] || 0}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-gray-100"
                                onClick={() => updateQuantity(variant.id, 1)}
                                disabled={!canAddMore() && (!cart[variant.id] || cart[variant.id] === 0)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator className="my-8 max-w-5xl mx-auto" />

        {/* Event Info */}
        <div id="info" className="max-w-5xl mx-auto mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">
            INFORMAÇÕES
          </h2>

          <div className="bg-gray-100 rounded-lg p-6 md:p-8 space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                HENRIQUE E JULIANO + NATTAN - AHH VERÃO
              </h3>
              <div className="text-gray-800 text-left space-y-2 mb-4">
                <p className="font-semibold">INFORMATIVO DO SHOW</p>
                <p>02 DE JANEIRO DE 2026</p>
                <p>ARENA OPEN - CAMBORIÚ/SC</p>
                <p>21H - ABERTURA DOS PORTÕES</p>
                <p>00H - INÍCIO DOS SHOWS</p>
                <p className="text-sm italic">*HORÁRIO SUJEITO A ALTERAÇÃO SEM AVISO PRÉVIO</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                CLASSIFICAÇÃO ETÁRIA
              </h3>
              <div className="text-gray-800 space-y-2">
                <p><strong>Setores Arena e VIP:</strong> Menores com até 15 anos completos, somente acompanhados dos pais. Menores com 16 e 17 anos desacompanhados dos pais deverão apresentar Autorização com assinatura reconhecida em cartório.</p>
                <p><strong>Setor Premium Open Bar:</strong> Não é permitida a entrada de menores de 18 anos.</p>
                <p className="text-red-600 font-medium">OBS: É EXPRESSAMENTE PROIBIDO CONSUMO E VENDA DE BEBIDAS ALCOÓLICAS PARA MENORES DE 18 ANOS.</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                DESCRITIVO DOS SETORES
              </h3>
              <div className="space-y-4 text-gray-800">
                <div>
                  <p className="font-semibold text-yellow-600">FRONTSTAGE OPEN FOOD</p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Espaço limitado, exclusivo e privilegiado com acesso à frente do palco</li>
                    <li>Ao entrar no evento você receberá um copo exclusivo do setor</li>
                    <li>Open Food completo com: Massas, risotos e doces</li>
                    <li>Área de convivência</li>
                    <li>Bares e banheiros no setor</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-purple-600">PREMIUM OPEN BAR</p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Open Bar de Água, cerveja, refrigerante, suco, vodka</li>
                    <li>Entrada exclusiva</li>
                    <li>Acesso à frente do palco</li>
                    <li>Banheiros exclusivos no setor</li>
                    <li>Área de Convivência com 2.000m², exclusivo do Setor Premium</li>
                    <li>Ambiente coberto e climatizado</li>
                    <li>Lounge para descanso</li>
                    <li>Transmissão Simultânea dos Shows em Telão de LED</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-blue-600">ÁREA VIP</p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Visão frontal do palco</li>
                    <li>Acesso à passarela</li>
                    <li>Área de convivência</li>
                    <li>Banheiros exclusivos no setor</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-green-600">ARENA</p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Visão frontal do palco</li>
                    <li>Área de convivência</li>
                    <li>Setor com o menor custo</li>
                    <li>Bares e banheiros no setor</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                INFORMAÇÕES IMPORTANTES
              </h3>
              <div className="space-y-3 text-gray-800 text-sm">
                <p>• Este evento poderá ser gravado, filmado ou fotografado. Ao participar do evento o portador do ingresso concorda e autoriza a utilização gratuita de sua imagem por prazo indeterminado.</p>
                <p>• É proibido a entrada no evento com copos, latas, cadeiras, bancos, objetos pontiagudos e/ou cortantes, guarda-chuvas, armas de fogo, cigarros eletrônicos, dispositivos explosivos, objetos de vidro e/ou metal, drones.</p>
                <p>• Para sua segurança este evento conta com Guarda-volumes. Cuide dos seus pertences, não nos responsabilizamos por objetos perdidos durante o evento.</p>
                <p>• A entrada de menores é proibida nas áreas de Open Bar.</p>
                <p>• Não há circulação de público entre os setores, exceto equipe em trabalho.</p>
                <p>• Chegue cedo, evite filas, e divirta-se.</p>
              </div>
            </div>

            <Separator />

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-bold mb-2 text-green-800">
                🌱 ESTE SHOW VAI TER COPO ECOLÓGICO!
              </h3>
              <p className="text-sm text-green-700">
                São copos 100% recicláveis, resistentes e duráveis. Você deverá adquirir para consumir bebidas no evento. 
                Ao final do evento, a escolha é sua: ou devolve e é ressarcido ou leva para casa de recordação!
              </p>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p className="font-medium">CONTATO ATENDIMENTO</p>
              <p>(48) 98820-5632</p>
              <p>@gdoproducoes</p>
            </div>
          </div>
        </div>

        <Separator className="my-8 max-w-5xl mx-auto" />

        {/* Sales Rules */}
        <div className="max-w-5xl mx-auto mb-8">
          <Accordion type="single" collapsible className="bg-white rounded-lg shadow-md">
            <AccordionItem value="item-1" className="border-none">
              <AccordionTrigger className="px-6 py-4 text-xl font-semibold hover:no-underline">
                Regras para venda on-line
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 space-y-3 text-sm text-gray-600">
                <p>1. Todas as disposições aplicáveis às vendas de ingressos pela plataforma da Guichê Web se encontram previstas nos Termos de Uso.</p>
                <p>2. A Guichê Web é uma plataforma intermediária especializada na venda de ingressos online e não organiza os eventos comercializados.</p>
                <p>3. Para acessar o evento é obrigatória a apresentação do ingresso impresso e assinado ou em formato digital através do App (Guichê Web), juntamente com documento de identificação oficial com foto.</p>
                <p>4. O não comparecimento ao evento invalidará o ingresso e não permitirá reembolso.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <Separator className="my-8 max-w-5xl mx-auto" />

        {/* Location */}
        <div id="localizacao" className="max-w-5xl mx-auto mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">
            LOCALIZAÇÃO
          </h2>
          <Separator className="mb-6" />
          <div className="aspect-video rounded-lg overflow-hidden shadow-md">
            <iframe
              src={eventData.mapsEmbedUrl}
              className="w-full h-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="max-w-5xl mx-auto bg-black text-white py-8 rounded-lg">
          <div className="text-center space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <div className="bg-white text-black px-6 py-3 rounded-lg flex items-center gap-3 hover:bg-gray-100 transition-colors">
                  <div className="text-left">
                    <div className="text-xs">Disponível na</div>
                    <div className="text-lg font-semibold">App Store</div>
                  </div>
                </div>
              </a>

              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <div className="bg-white text-black px-6 py-3 rounded-lg flex items-center gap-3 hover:bg-gray-100 transition-colors">
                  <div className="text-left">
                    <div className="text-xs">Disponível no</div>
                    <div className="text-lg font-semibold">Google Play</div>
                  </div>
                </div>
              </a>
            </div>

            <div className="space-y-2 text-sm text-gray-300 px-4">
              <p>Guichê Web Comercialização de Ingressos Ltda - CNPJ - 18.797.249/0001-35</p>
              <p>Todos os preços e condições comerciais estão sujeitos a alteração comercial sem aviso prévio.</p>
              <p>©Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Fixed Cart */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 shadow-2xl z-50" style={{ backgroundColor: 'rgba(29, 115, 28, 0.95)' }}>
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              <div className="flex-1">
                <p className="font-bold text-white text-sm mb-1">
                  {getTotalItems()} {getTotalItems() === 1 ? 'ITEM' : 'ITENS'} NO CARRINHO
                </p>
                <p className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(cartTotal)}
                </p>
                <p className="text-sm text-white">
                  Taxa: R$ 0,00
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-sm text-white">Tudo pronto?</p>
                <Button
                  size="lg"
                  className="bg-white hover:bg-gray-100 text-gray-900 font-semibold"
                  onClick={handleCheckout}
                >
                  CONTINUAR
                  <span className="ml-2">›</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ingressos;
