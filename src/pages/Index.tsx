import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Ticket, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
interface Event {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  event_date: string;
  event_time: string;
  banner_url: string;
  cover_url: string;
  is_active: boolean;
  show_on_home: boolean;
}
const Index = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    fetchEvents();
  }, []);
  const fetchEvents = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("events").select("*").eq("is_active", true).eq("show_on_home", true).order("event_date", {
        ascending: true
      });
      if (error) throw error;
      const allEvents = data || [];
      // Featured events are those with banners
      setFeaturedEvents(allEvents.filter(e => e.banner_url));
      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return format(date, "dd/MM/yyyy", {
      locale: ptBR
    });
  };
  const extractCity = (location: string) => {
    // Extract city/state from location string
    const parts = location.split(" - ");
    return parts[parts.length - 1] || location;
  };
  const handleEventClick = (slug: string) => {
    if (slug === "ahh-verao-henrique-e-juliano-nattan") {
      navigate(`/${slug}`);
    } else {
      navigate(`/e/${slug}`);
    }
  };
  const filteredEvents = events.filter(event => event.name.toLowerCase().includes(searchTerm.toLowerCase()) || event.location.toLowerCase().includes(searchTerm.toLowerCase()));
  return <div className="min-h-screen bg-[#F5F0E8]">
      {/* Header */}
      <header className="shadow-sm sticky top-0 z-50 bg-black">
        <div className="container mx-auto px-4 py-3 bg-black">
          <div className="items-center justify-between flex flex-row gap-[16px] mx-[25px] px-[25px]">
            {/* Logo */}
            <img alt="Guichê Web Logo" className="h-8 md:h-10 cursor-pointer" onClick={() => navigate("/")} src="https://s3.guicheweb.com.br/nova_marca/logogw.png" />

            {/* Search Bar */}
            <div className="flex-1 max-w-xl hidden md:block">
              <div className="relative bg-black px-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="text" placeholder="Faça sua pesquisa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-10 bg-gray-50 border-gray-200 rounded-full" />
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Login Button and Flag */}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/gw-admin-2025")} className="border-gray-300 text-primary-foreground border-2 rounded bg-black">
                ENTRAR
              </Button>
              <img src="/brazil-flag.png" alt="Brasil" className="h-6 w-auto" />
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="text" placeholder="Faça sua pesquisa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-10 bg-gray-50 border-gray-200 rounded-full" />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Home Banner */}
      <section className="relative bg-black">
        <img 
          src="https://cdn.guicheweb.com.br/gw-bucket/banners/07-10-2025_12-03-15.jpg" 
          alt="Banner" 
          className="w-full max-h-[350px] md:max-h-[400px] object-contain" 
        />
      </section>

      {/* Featured Events Section (3 cards) */}
      {!loading && featuredEvents.length > 0 && <section className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
              {featuredEvents.slice(0, 3).map(event => <div key={event.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer group w-[200px]" onClick={() => handleEventClick(event.slug)}>
                  <div className="aspect-[3/4] overflow-hidden">
                    <img src={event.cover_url || event.banner_url} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                </div>)}
            </div>
          </div>
        </section>}

      {/* Events List Section */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Escolha um Evento
        </h2>

        {loading ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="bg-white rounded-xl overflow-hidden shadow">
                <Skeleton className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-3 w-1/2 bg-gray-200" />
                  <Skeleton className="h-4 w-full bg-gray-200" />
                  <Skeleton className="h-3 w-2/3 bg-gray-200" />
                </div>
              </div>)}
          </div> : filteredEvents.length === 0 ? <div className="text-center py-16">
            <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm ? "Nenhum evento encontrado" : "Nenhum evento disponível"}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? "Tente outra pesquisa" : "Volte em breve para conferir novos eventos!"}
            </p>
          </div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredEvents.map(event => <div key={event.id} className="bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition-all cursor-pointer group" onClick={() => handleEventClick(event.slug)}>
                {/* Event Image */}
                <div className="aspect-square overflow-hidden relative">
                  {event.cover_url || event.banner_url ? <img src={event.cover_url || event.banner_url} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                      <Ticket className="h-12 w-12 text-white/70" />
                    </div>}
                </div>

                {/* Event Info */}
                <div className="p-3 md:p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    {extractCity(event.location)}
                  </p>
                  <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-2 mb-1 group-hover:text-orange-600 transition-colors">
                    {event.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatEventDate(event.event_date)}
                  </p>
                </div>
              </div>)}
          </div>}
      </section>

      {/* Footer */}
      <footer className="mt-12 text-white bg-black">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Institucional */}
            <div>
              <h3 className="text-lg font-semibold mb-4 italic">Institucional</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Nossa Marca</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            {/* Minha Conta */}
            <div>
              <h3 className="text-lg font-semibold mb-4 italic">Minha Conta</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Meus pedidos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Alterar Senha</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Lembrar Senha</a></li>
              </ul>
            </div>
            
            {/* Ajuda */}
            <div>
              <h3 className="text-lg font-semibold mb-4 italic">Ajuda</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Dúvidas frequentes</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos e políticas</a></li>
              </ul>
            </div>
            
            {/* Logo and App */}
            <div className="flex flex-col items-start lg:items-end gap-4">
              <img alt="Guichê Web Logo" className="h-10" src="https://s3.guicheweb.com.br/nova_marca/logogw.png" />
              
              <div className="text-center lg:text-right">
                <p className="text-xs text-gray-400 mb-2">COMPRE PELO APP</p>
                <div className="flex gap-2">
                  <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer">
                    <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" className="h-8 invert" />
                  </a>
                  <a href="https://play.google.com" target="_blank" rel="noopener noreferrer">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-8" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-6">
          <div className="container mx-auto px-4 text-center text-xs text-gray-400">
            <p>Guichê Web Comercialização de Ingressos Ltda - CNPJ - 18.797.249/0001-35</p>
            <p className="mt-1">Todos os preços e condições comerciais estão sujeitos a alteração comercial sem aviso prévio.</p>
            <p className="mt-3">©Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;