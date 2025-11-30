import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Clock, Ticket } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
}

const Index = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const formatTime = (time: string) => {
    return time?.slice(0, 5) || "";
  };

  const handleEventClick = (slug: string) => {
    // Check if it's the legacy event
    if (slug === "ahh-verao-henrique-e-juliano-nattan") {
      navigate(`/${slug}`);
    } else {
      navigate(`/e/${slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <img
              src="https://s3.guicheweb.com.br/nova_marca/logogw_branca.png"
              alt="Guichê Web Logo"
              className="h-10 md:h-12"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Encontre os melhores eventos
          </h1>
          <p className="text-lg md:text-xl text-slate-400">
            Compre seus ingressos de forma rápida e segura
          </p>
        </div>
      </section>

      {/* Events Grid */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <Ticket className="h-6 w-6 text-emerald-500" />
            Eventos Disponíveis
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-slate-800/50 border-slate-700 overflow-hidden">
                  <Skeleton className="h-48 w-full bg-slate-700" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4 bg-slate-700" />
                    <Skeleton className="h-4 w-1/2 bg-slate-700" />
                    <Skeleton className="h-4 w-2/3 bg-slate-700" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <Ticket className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">
                Nenhum evento disponível no momento
              </h3>
              <p className="text-slate-500">
                Volte em breve para conferir novos eventos!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="bg-slate-800/50 border-slate-700 overflow-hidden hover:border-emerald-500/50 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-emerald-500/10"
                  onClick={() => handleEventClick(event.slug)}
                >
                  {/* Event Image */}
                  <div className="relative h-48 overflow-hidden">
                    {event.banner_url || event.cover_url ? (
                      <img
                        src={event.banner_url || event.cover_url}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center">
                        <Ticket className="h-16 w-16 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    <Badge className="absolute top-3 right-3 bg-emerald-500 text-white border-0">
                      Disponível
                    </Badge>
                  </div>

                  {/* Event Info */}
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">
                      {event.name}
                    </h3>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{formatEventDate(event.event_date)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>{formatTime(event.event_time)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-emerald-400 font-semibold text-sm group-hover:text-emerald-300 transition-colors">
                        Ver ingressos →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800 py-8 px-4">
        <div className="container mx-auto text-center">
          <img
            src="https://s3.guicheweb.com.br/nova_marca/logogw_branca.png"
            alt="Guichê Web Logo"
            className="h-8 mx-auto mb-4 opacity-50"
          />
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Guichê Web. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
