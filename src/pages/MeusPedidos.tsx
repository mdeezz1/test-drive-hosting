import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Navbar from "@/components/Navbar";
import TicketView from "@/components/TicketView";
import SearchOrdersDialog from "@/components/SearchOrdersDialog";
import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface EventData {
  name: string;
  location: string;
  date: string;
  time: string;
  openingTime?: string;
  coverUrl?: string;
}

interface Order {
  id: string;
  transaction_id: string;
  customer_name: string;
  customer_cpf: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const MeusPedidos = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [eventData, setEventData] = useState<EventData | undefined>(undefined);
  const [resolvedEventData, setResolvedEventData] = useState<EventData | undefined>(undefined);
  const ticketRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Check if coming from payment success or with orders from search
  useEffect(() => {
    const state = location.state as { 
      orders?: Order[]; 
      fromPayment?: boolean; 
      transactionId?: string;
      searchQuery?: string;
      eventData?: EventData;
    } | null;

    if (state?.eventData) {
      setEventData(state.eventData);
    }

    if (state?.orders) {
      // Parse items if they're strings
      const parsedOrders = state.orders.map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
      }));
      setOrders(parsedOrders);
    } else if (state?.fromPayment && state?.transactionId) {
      // Fetch order by transaction ID
      fetchOrderByTransaction(state.transactionId);
    } else {
      // Show search dialog if no orders
      setSearchDialogOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (!eventData?.coverUrl) {
      setResolvedEventData(eventData);
      return;
    }

    let isCancelled = false;

    const convertCoverToDataUrl = async () => {
      try {
        const response = await fetch(eventData.coverUrl as string, { mode: "cors" });
        if (!response.ok) {
          setResolvedEventData(eventData);
          return;
        }

        const blob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = () => {
          if (!isCancelled) {
            setResolvedEventData({
              ...eventData,
              coverUrl: typeof reader.result === "string" ? reader.result : eventData.coverUrl,
            });
          }
        };

        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Erro ao carregar imagem do evento:", error);
        setResolvedEventData(eventData);
      }
    };

    convertCoverToDataUrl();

    return () => {
      isCancelled = true;
    };
  }, [eventData]);

  const fetchOrderByTransaction = async (transactionId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('transaction_id', transactionId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching order:', error);
        toast.error("Erro ao buscar pedido");
        return;
      }

      if (data) {
        const parsedOrder = {
          ...data,
          items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items
        };
        setOrders([parsedOrder]);
      } else {
        toast.info("Pedido ainda não encontrado. Tente novamente em alguns segundos.");
        setSearchDialogOpen(true);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error("Erro ao buscar pedido");
    } finally {
      setIsLoading(false);
    }
  };

  const inlineTicketImages = async (ticketElement: HTMLDivElement) => {
    const images = Array.from(ticketElement.getElementsByTagName("img"));

    await Promise.all(
      images.map(async (img) => {
        const src = img.getAttribute("src");
        if (!src || src.startsWith("data:")) return;

        try {
          const response = await fetch(src);
          if (!response.ok) return;

          const blob = await response.blob();
          const reader = new FileReader();

          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result);
              } else {
                reject(new Error("Falha ao converter imagem para Data URL"));
              }
            };

            reader.onerror = () => reject(new Error("Erro ao ler imagem"));
            reader.readAsDataURL(blob);
          });

          img.src = dataUrl;

          await new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          });
        } catch (error) {
          console.error("Erro ao preparar imagem para o PDF:", error);
        }
      })
    );
  };

  const generatePDF = async (order: Order, ticketIndex: number) => {
    setIsGeneratingPdf(true);
    
    try {
      const ticketElement = ticketRefs.current[`${order.id}-${ticketIndex}`];
      if (!ticketElement) {
        toast.error("Erro ao gerar PDF");
        return;
      }

      // Criar um clone fora da tela com largura fixa para garantir padrão A4
      const clone = ticketElement.cloneNode(true) as HTMLDivElement;
      clone.style.position = "fixed";
      clone.style.left = "-10000px";
      clone.style.top = "0";
      clone.style.width = "800px";
      clone.style.maxWidth = "800px";
      clone.style.transform = "none";
      clone.style.backgroundColor = "#ffffff";
      document.body.appendChild(clone);

      const ticketRoot = clone.querySelector("[data-ticket-root]") as HTMLDivElement | null;
      if (ticketRoot) {
        ticketRoot.style.maxWidth = "100%";
        ticketRoot.style.width = "100%";
      }

      await inlineTicketImages(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      let imgWidth = maxWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > maxHeight) {
        const scaleFactor = maxHeight / imgHeight;
        imgWidth = imgWidth * scaleFactor;
        imgHeight = imgHeight * scaleFactor;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = margin;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`ingresso-${order.transaction_id}-${ticketIndex + 1}.pdf`);
      
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateAllPDFs = async (order: Order) => {
    setIsGeneratingPdf(true);
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      const totalTickets = order.items.reduce((sum, item) => sum + item.quantity, 0);
      
      for (let i = 0; i < totalTickets; i++) {
        const ticketElement = ticketRefs.current[`${order.id}-${i}`];
        if (!ticketElement) continue;

        // Criar um clone fora da tela com largura fixa para garantir padrão A4
        const clone = ticketElement.cloneNode(true) as HTMLDivElement;
        clone.style.position = "fixed";
        clone.style.left = "-10000px";
        clone.style.top = "0";
        clone.style.width = "800px";
        clone.style.maxWidth = "800px";
        clone.style.transform = "none";
        clone.style.backgroundColor = "#ffffff";
        document.body.appendChild(clone);

        const ticketRoot = clone.querySelector("[data-ticket-root]") as HTMLDivElement | null;
        if (ticketRoot) {
          ticketRoot.style.maxWidth = "100%";
          ticketRoot.style.width = "100%";
        }

        await inlineTicketImages(clone);

        const canvas = await html2canvas(clone, {
          scale: 2,
          backgroundColor: "#ffffff",
        });

        document.body.removeChild(clone);

        const imgData = canvas.toDataURL('image/png');

        let imgWidth = maxWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (imgHeight > maxHeight) {
          const scaleFactor = maxHeight / imgHeight;
          imgWidth = imgWidth * scaleFactor;
          imgHeight = imgHeight * scaleFactor;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = margin;

        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      }

      pdf.save(`ingressos-${order.transaction_id}.pdf`);
      toast.success("Todos os ingressos foram gerados!");
    } catch (err) {
      console.error('Error generating PDFs:', err);
      toast.error("Erro ao gerar PDFs");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Expand items into individual tickets
  const expandOrderToTickets = (order: Order) => {
    const tickets: { order: Order; itemIndex: number; ticketIndex: number; item: OrderItem }[] = [];
    let globalTicketIndex = 0;

    order.items.forEach((item, itemIndex) => {
      for (let i = 0; i < item.quantity; i++) {
        tickets.push({
          order,
          itemIndex,
          ticketIndex: globalTicketIndex,
          item,
        });
        globalTicketIndex++;
      }
    });

    return tickets;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-yellow-600 mx-auto mb-4" />
            <p className="text-gray-600">Buscando seus pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-gray-600"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">Meus Pedidos</h1>
            </div>
            <Button
              onClick={() => setSearchDialogOpen(true)}
              variant="outline"
              className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
            >
              <Search className="h-5 w-5 mr-2" />
              Buscar Outro Pedido
            </Button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Nenhum pedido encontrado
              </h2>
              <p className="text-gray-600 mb-6">
                Busque seus pedidos usando seu CPF ou e-mail
              </p>
              <Button
                onClick={() => setSearchDialogOpen(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
              >
                <Search className="h-5 w-5 mr-2" />
                Buscar Pedidos
              </Button>
            </div>
          ) : (
            orders.map((order) => {
              const tickets = expandOrderToTickets(order);
              const totalTickets = tickets.length;

              return (
                <div key={order.id} className="mb-8">
                  {/* Order Header */}
                  <div className="bg-white rounded-t-lg shadow-sm border border-b-0 p-4">
                    <h2 className="font-bold text-lg text-gray-800">
                      Pedido #{order.transaction_id}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {totalTickets} ingresso{totalTickets > 1 ? 's' : ''} • Total: R$ {order.total_amount.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  {/* Tickets */}
                  <div className="space-y-4">
                    {tickets.map(({ ticketIndex, item }) => (
                      <div key={`${order.id}-${ticketIndex}`} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        {/* Download Button */}
                        <div className="bg-gray-50 border-b p-4 flex justify-end">
                          <Button
                            onClick={() => generatePDF(order, ticketIndex)}
                            disabled={isGeneratingPdf}
                            variant="outline"
                            className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                          >
                            {isGeneratingPdf ? (
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-5 w-5 mr-2" />
                            )}
                            Baixar Este Ingresso
                          </Button>
                        </div>

                        {/* Ticket Content */}
                        <div 
                          ref={(el) => ticketRefs.current[`${order.id}-${ticketIndex}`] = el}
                        >
                          <TicketView
                            orderId={order.id}
                            transactionId={order.transaction_id}
                            customerName={order.customer_name}
                            customerCpf={order.customer_cpf}
                            customerEmail={order.customer_email}
                            items={[{ ...item, quantity: 1 }]}
                            totalAmount={item.price}
                            paidAt={order.updated_at}
                            ticketIndex={ticketIndex}
                            totalTickets={totalTickets}
                            eventData={resolvedEventData ?? eventData}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <SearchOrdersDialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen} />
    </div>
  );
};

export default MeusPedidos;
