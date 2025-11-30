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
  const ticketRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Check if coming from payment success or with orders from search
  useEffect(() => {
    const state = location.state as { 
      orders?: Order[]; 
      fromPayment?: boolean; 
      transactionId?: string;
      searchQuery?: string;
    } | null;

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

  const generatePDF = async (order: Order, ticketIndex: number) => {
    setIsGeneratingPdf(true);
    
    try {
      const ticketElement = ticketRefs.current[`${order.id}-${ticketIndex}`];
      if (!ticketElement) {
        toast.error("Erro ao gerar PDF");
        return;
      }

      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
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

      const totalTickets = order.items.reduce((sum, item) => sum + item.quantity, 0);
      
      for (let i = 0; i < totalTickets; i++) {
        const ticketElement = ticketRefs.current[`${order.id}-${i}`];
        if (!ticketElement) continue;

        const canvas = await html2canvas(ticketElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
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
                  <div className="bg-white rounded-t-lg shadow-sm border border-b-0 p-4 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="font-bold text-lg text-gray-800">
                        Pedido #{order.transaction_id}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {totalTickets} ingresso{totalTickets > 1 ? 's' : ''} • Total: R$ {order.total_amount.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <Button
                      onClick={() => generateAllPDFs(order)}
                      disabled={isGeneratingPdf}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isGeneratingPdf ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-5 w-5 mr-2" />
                      )}
                      Baixar Todos os Ingressos
                    </Button>
                  </div>

                  {/* Tickets */}
                  <div className="space-y-4">
                    {tickets.map(({ ticketIndex, item }) => (
                      <div key={`${order.id}-${ticketIndex}`} className="bg-white rounded-lg shadow-sm border overflow-hidden">
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
                          />
                        </div>

                        {/* Download Button */}
                        <div className="bg-gray-50 border-t p-4 flex justify-end">
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
