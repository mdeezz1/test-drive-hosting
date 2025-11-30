import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Ticket, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TicketType {
  id: string;
  event_id: string;
  sector: string;
  name: string;
  price: number;
  fee: number;
  available: number;
  color: string;
  sort_order: number;
  is_active: boolean;
}

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
  map_url: string;
  is_active: boolean;
  created_at: string;
  ticket_types: TicketType[];
}

const EventManager = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const { toast } = useToast();

  // Event form state
  const [eventForm, setEventForm] = useState({
    name: "",
    slug: "",
    description: "",
    location: "",
    event_date: "",
    event_time: "",
    banner_url: "",
    cover_url: "",
    map_url: "",
    is_active: true,
  });

  // Ticket form state
  const [ticketForm, setTicketForm] = useState({
    sector: "",
    name: "",
    price: "",
    fee: "",
    available: "",
    color: "#3B82F6",
    sort_order: "0",
    is_active: true,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-events", {
        body: { action: "list_events" },
      });

      if (error) throw error;
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({ title: "Erro", description: "Erro ao carregar eventos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async () => {
    try {
      const action = selectedEvent ? "update_event" : "create_event";
      const eventData = selectedEvent ? { ...eventForm, id: selectedEvent.id } : eventForm;

      const { data, error } = await supabase.functions.invoke("admin-events", {
        body: { action, data: eventData },
      });

      if (error) throw error;
      if (data.success) {
        toast({ title: "Sucesso", description: selectedEvent ? "Evento atualizado!" : "Evento criado!" });
        setShowEventDialog(false);
        resetEventForm();
        fetchEvents();
      }
    } catch (error) {
      console.error("Error saving event:", error);
      toast({ title: "Erro", description: "Erro ao salvar evento", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;

    try {
      const { data, error } = await supabase.functions.invoke("admin-events", {
        body: { action: "delete_event", data: { id: eventId } },
      });

      if (error) throw error;
      if (data.success) {
        toast({ title: "Sucesso", description: "Evento excluído!" });
        fetchEvents();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({ title: "Erro", description: "Erro ao excluir evento", variant: "destructive" });
    }
  };

  const handleSaveTicket = async () => {
    if (!selectedEvent) return;

    try {
      const action = selectedTicket ? "update_ticket_type" : "create_ticket_type";
      const ticketData = {
        ...(selectedTicket ? { id: selectedTicket.id } : {}),
        event_id: selectedEvent.id,
        sector: ticketForm.sector,
        name: ticketForm.name,
        price: parseFloat(ticketForm.price),
        fee: parseFloat(ticketForm.fee),
        available: parseInt(ticketForm.available),
        color: ticketForm.color,
        sort_order: parseInt(ticketForm.sort_order),
        is_active: ticketForm.is_active,
      };

      const { data, error } = await supabase.functions.invoke("admin-events", {
        body: { action, data: ticketData },
      });

      if (error) throw error;
      if (data.success) {
        toast({ title: "Sucesso", description: selectedTicket ? "Ingresso atualizado!" : "Ingresso criado!" });
        setShowTicketDialog(false);
        resetTicketForm();
        fetchEvents();
      }
    } catch (error) {
      console.error("Error saving ticket:", error);
      toast({ title: "Erro", description: "Erro ao salvar ingresso", variant: "destructive" });
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Tem certeza que deseja excluir este ingresso?")) return;

    try {
      const { data, error } = await supabase.functions.invoke("admin-events", {
        body: { action: "delete_ticket_type", data: { id: ticketId } },
      });

      if (error) throw error;
      if (data.success) {
        toast({ title: "Sucesso", description: "Ingresso excluído!" });
        fetchEvents();
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast({ title: "Erro", description: "Erro ao excluir ingresso", variant: "destructive" });
    }
  };

  const resetEventForm = () => {
    setEventForm({
      name: "",
      slug: "",
      description: "",
      location: "",
      event_date: "",
      event_time: "",
      banner_url: "",
      cover_url: "",
      map_url: "",
      is_active: true,
    });
    setSelectedEvent(null);
  };

  const resetTicketForm = () => {
    setTicketForm({
      sector: "",
      name: "",
      price: "",
      fee: "",
      available: "",
      color: "#3B82F6",
      sort_order: "0",
      is_active: true,
    });
    setSelectedTicket(null);
  };

  const openEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setEventForm({
      name: event.name,
      slug: event.slug,
      description: event.description || "",
      location: event.location,
      event_date: event.event_date,
      event_time: event.event_time,
      banner_url: event.banner_url || "",
      cover_url: event.cover_url || "",
      map_url: event.map_url || "",
      is_active: event.is_active,
    });
    setShowEventDialog(true);
  };

  const openAddTicket = (event: Event) => {
    setSelectedEvent(event);
    resetTicketForm();
    setShowTicketDialog(true);
  };

  const openEditTicket = (event: Event, ticket: TicketType) => {
    setSelectedEvent(event);
    setSelectedTicket(ticket);
    setTicketForm({
      sector: ticket.sector,
      name: ticket.name,
      price: ticket.price.toString(),
      fee: ticket.fee.toString(),
      available: ticket.available.toString(),
      color: ticket.color,
      sort_order: ticket.sort_order.toString(),
      is_active: ticket.is_active,
    });
    setShowTicketDialog(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Gerenciar Eventos</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchEvents} className="border-slate-600">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={showEventDialog} onOpenChange={(open) => { setShowEventDialog(open); if (!open) resetEventForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" /> Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">{selectedEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle>
                <DialogDescription className="text-slate-400">Preencha os dados do evento</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Nome</Label>
                    <Input value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <div>
                    <Label className="text-slate-300">Slug (URL)</Label>
                    <Input value={eventForm.slug} onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })} placeholder="meu-evento" className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Descrição</Label>
                  <Textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300">Local</Label>
                  <Input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Data</Label>
                    <Input type="date" value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <div>
                    <Label className="text-slate-300">Horário</Label>
                    <Input type="time" value={eventForm.event_time} onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">URL do Banner</Label>
                  <Input value={eventForm.banner_url} onChange={(e) => setEventForm({ ...eventForm, banner_url: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300">URL da Capa</Label>
                  <Input value={eventForm.cover_url} onChange={(e) => setEventForm({ ...eventForm, cover_url: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300">URL do Mapa</Label>
                  <Input value={eventForm.map_url} onChange={(e) => setEventForm({ ...eventForm, map_url: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={eventForm.is_active} onCheckedChange={(checked) => setEventForm({ ...eventForm, is_active: checked })} />
                  <Label className="text-slate-300">Evento ativo</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEventDialog(false)} className="border-slate-600">Cancelar</Button>
                <Button onClick={handleSaveEvent} className="bg-emerald-600 hover:bg-emerald-700">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Events List */}
      {events.map((event) => (
        <Card key={event.id} className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  {event.name}
                  {event.is_active ? (
                    <Badge className="bg-emerald-600">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {event.location} • {format(new Date(event.event_date), "dd/MM/yyyy", { locale: ptBR })} às {event.event_time}
                </CardDescription>
                <p className="text-slate-500 text-xs mt-1">/{event.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEditEvent(event)} className="text-slate-400 hover:text-white">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-white font-medium">Ingressos</h4>
              <Button size="sm" onClick={() => openAddTicket(event)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-3 w-3 mr-1" /> Adicionar Ingresso
              </Button>
            </div>
            {event.ticket_types && event.ticket_types.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Setor</TableHead>
                    <TableHead className="text-slate-400">Nome</TableHead>
                    <TableHead className="text-slate-400">Preço</TableHead>
                    <TableHead className="text-slate-400">Taxa</TableHead>
                    <TableHead className="text-slate-400">Disponíveis</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {event.ticket_types.map((ticket) => (
                    <TableRow key={ticket.id} className="border-slate-700">
                      <TableCell className="text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ticket.color }} />
                          {ticket.sector}
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{ticket.name}</TableCell>
                      <TableCell className="text-white">{formatCurrency(ticket.price)}</TableCell>
                      <TableCell className="text-slate-400">{formatCurrency(ticket.fee)}</TableCell>
                      <TableCell className="text-white">{ticket.available}</TableCell>
                      <TableCell>
                        {ticket.is_active ? (
                          <Badge className="bg-emerald-600">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditTicket(event, ticket)} className="h-8 w-8 text-slate-400 hover:text-white">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTicket(ticket.id)} className="h-8 w-8 text-red-400 hover:text-red-300">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-slate-500 text-sm">Nenhum ingresso cadastrado</p>
            )}
          </CardContent>
        </Card>
      ))}

      {events.length === 0 && !loading && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-8 text-center">
            <Ticket className="h-12 w-12 mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400">Nenhum evento cadastrado</p>
            <p className="text-slate-500 text-sm">Clique em "Novo Evento" para criar seu primeiro evento</p>
          </CardContent>
        </Card>
      )}

      {/* Ticket Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={(open) => { setShowTicketDialog(open); if (!open) { resetTicketForm(); setSelectedEvent(null); } }}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedTicket ? "Editar Ingresso" : "Novo Ingresso"}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedEvent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Setor</Label>
                <Input value={ticketForm.sector} onChange={(e) => setTicketForm({ ...ticketForm, sector: e.target.value })} placeholder="Arena, VIP, etc" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Nome</Label>
                <Input value={ticketForm.name} onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })} placeholder="Inteira, Meia, etc" className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Preço (R$)</Label>
                <Input type="number" step="0.01" value={ticketForm.price} onChange={(e) => setTicketForm({ ...ticketForm, price: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Taxa (R$)</Label>
                <Input type="number" step="0.01" value={ticketForm.fee} onChange={(e) => setTicketForm({ ...ticketForm, fee: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Quantidade Disponível</Label>
                <Input type="number" value={ticketForm.available} onChange={(e) => setTicketForm({ ...ticketForm, available: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Cor</Label>
                <Input type="color" value={ticketForm.color} onChange={(e) => setTicketForm({ ...ticketForm, color: e.target.value })} className="bg-slate-700 border-slate-600 h-10" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={ticketForm.is_active} onCheckedChange={(checked) => setTicketForm({ ...ticketForm, is_active: checked })} />
              <Label className="text-slate-300">Ingresso ativo</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowTicketDialog(false)} className="border-slate-600">Cancelar</Button>
            <Button onClick={handleSaveTicket} className="bg-emerald-600 hover:bg-emerald-700">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventManager;
