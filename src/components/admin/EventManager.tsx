import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, Pencil, Trash2, Ticket, RefreshCw, Upload, Image, MapPin, 
  Instagram, Facebook, Youtube, Link, Calendar, Clock, Eye, EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TicketType {
  id: string;
  event_id: string;
  sector: string;
  name: string;
  description: string;
  price: number;
  fee: number;
  available: number;
  color: string;
  batch: string;
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
  opening_time: string;
  banner_url: string;
  cover_url: string;
  map_url: string;
  event_map_url: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  google_maps_embed: string;
  is_active: boolean;
  created_at: string;
  ticket_types: TicketType[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const EventManager = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [eventTab, setEventTab] = useState("basic");
  const { toast } = useToast();

  // Event form state
  const [eventForm, setEventForm] = useState({
    name: "",
    slug: "",
    description: "",
    location: "",
    event_date: "",
    event_time: "",
    opening_time: "",
    banner_url: "",
    cover_url: "",
    map_url: "",
    event_map_url: "",
    instagram_url: "",
    facebook_url: "",
    youtube_url: "",
    google_maps_embed: "",
    is_active: true,
  });

  // Ticket form state
  const [ticketForm, setTicketForm] = useState({
    sector: "",
    name: "",
    description: "",
    price: "",
    fee: "",
    available: "",
    color: "#3B82F6",
    batch: "Lote 1",
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

  const handleUploadImage = async (file: File, type: 'banner' | 'cover' | 'map' | 'event_map') => {
    if (!file) return;
    
    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/event-images/${filePath}`;

      const fieldMap = {
        banner: 'banner_url',
        cover: 'cover_url',
        map: 'map_url',
        event_map: 'event_map_url'
      };

      setEventForm(prev => ({ ...prev, [fieldMap[type]]: publicUrl }));
      toast({ title: "Sucesso", description: "Imagem enviada com sucesso!" });
    } catch (error) {
      console.error("Error uploading:", error);
      toast({ title: "Erro", description: "Erro ao enviar imagem", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const handleSaveEvent = async () => {
    if (!eventForm.name || !eventForm.slug || !eventForm.location || !eventForm.event_date || !eventForm.event_time) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

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
    if (!confirm("Tem certeza que deseja excluir este evento? Todos os ingressos também serão excluídos.")) return;

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
    if (!ticketForm.sector || !ticketForm.name || !ticketForm.price || !ticketForm.available) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    try {
      const action = selectedTicket ? "update_ticket_type" : "create_ticket_type";
      const ticketData = {
        ...(selectedTicket ? { id: selectedTicket.id } : {}),
        event_id: selectedEvent.id,
        sector: ticketForm.sector,
        name: ticketForm.name,
        description: ticketForm.description,
        price: parseFloat(ticketForm.price),
        fee: parseFloat(ticketForm.fee) || 0,
        available: parseInt(ticketForm.available),
        color: ticketForm.color,
        batch: ticketForm.batch,
        sort_order: parseInt(ticketForm.sort_order) || 0,
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
      name: "", slug: "", description: "", location: "",
      event_date: "", event_time: "", opening_time: "",
      banner_url: "", cover_url: "", map_url: "", event_map_url: "",
      instagram_url: "", facebook_url: "", youtube_url: "", google_maps_embed: "",
      is_active: true,
    });
    setSelectedEvent(null);
    setEventTab("basic");
  };

  const resetTicketForm = () => {
    setTicketForm({
      sector: "", name: "", description: "", price: "", fee: "",
      available: "", color: "#3B82F6", batch: "Lote 1", sort_order: "0", is_active: true,
    });
    setSelectedTicket(null);
  };

  const openEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setEventForm({
      name: event.name || "",
      slug: event.slug || "",
      description: event.description || "",
      location: event.location || "",
      event_date: event.event_date || "",
      event_time: event.event_time || "",
      opening_time: event.opening_time || "",
      banner_url: event.banner_url || "",
      cover_url: event.cover_url || "",
      map_url: event.map_url || "",
      event_map_url: event.event_map_url || "",
      instagram_url: event.instagram_url || "",
      facebook_url: event.facebook_url || "",
      youtube_url: event.youtube_url || "",
      google_maps_embed: event.google_maps_embed || "",
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
      sector: ticket.sector || "",
      name: ticket.name || "",
      description: ticket.description || "",
      price: ticket.price?.toString() || "",
      fee: ticket.fee?.toString() || "",
      available: ticket.available?.toString() || "",
      color: ticket.color || "#3B82F6",
      batch: ticket.batch || "Lote 1",
      sort_order: ticket.sort_order?.toString() || "0",
      is_active: ticket.is_active,
    });
    setShowTicketDialog(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const ImageUploadField = ({ 
    label, type, value, description 
  }: { 
    label: string; type: 'banner' | 'cover' | 'map' | 'event_map'; value: string; description: string;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const fieldMap: Record<string, string> = { banner: 'banner_url', cover: 'cover_url', map: 'map_url', event_map: 'event_map_url' };

    return (
      <div className="space-y-2">
        <Label className="text-slate-300">{label}</Label>
        <p className="text-xs text-slate-500">{description}</p>
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => setEventForm(prev => ({ ...prev, [fieldMap[type]]: e.target.value }))}
            placeholder="URL da imagem ou faça upload"
            className="bg-slate-700 border-slate-600 text-white flex-1"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], type)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => inputRef.current?.click()}
            disabled={uploading === type}
            className="border-slate-600"
          >
            {uploading === type ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </Button>
        </div>
        {value && (
          <div className="mt-2 rounded-lg overflow-hidden border border-slate-600 max-w-xs">
            <img src={value} alt={label} className="w-full h-auto" />
          </div>
        )}
      </div>
    );
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
            <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">{selectedEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle>
                <DialogDescription className="text-slate-400">Configure todos os detalhes do evento</DialogDescription>
              </DialogHeader>
              
              <Tabs value={eventTab} onValueChange={setEventTab} className="mt-4">
                <TabsList className="bg-slate-700 w-full grid grid-cols-4">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="images">Imagens</TabsTrigger>
                  <TabsTrigger value="social">Redes Sociais</TabsTrigger>
                  <TabsTrigger value="location">Localização</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Nome do Evento *</Label>
                      <Input value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} placeholder="Ex: Show do Artista" className="bg-slate-700 border-slate-600 text-white" />
                    </div>
                    <div>
                      <Label className="text-slate-300">Slug (URL) *</Label>
                      <Input value={eventForm.slug} onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="ex: show-do-artista" className="bg-slate-700 border-slate-600 text-white" />
                      <p className="text-xs text-slate-500 mt-1">Será usado na URL: /slug-do-evento</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Descrição</Label>
                    <Textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Descrição do evento..." className="bg-slate-700 border-slate-600 text-white" rows={3} />
                  </div>
                  <div>
                    <Label className="text-slate-300">Local *</Label>
                    <Input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Ex: Arena Open Camboriú - CAMBORIÚ/SC" className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-slate-300">Data *</Label>
                      <Input type="date" value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                    </div>
                    <div>
                      <Label className="text-slate-300">Horário do Evento *</Label>
                      <Input type="time" value={eventForm.event_time} onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                    </div>
                    <div>
                      <Label className="text-slate-300">Abertura dos Portões</Label>
                      <Input type="time" value={eventForm.opening_time} onChange={(e) => setEventForm({ ...eventForm, opening_time: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch checked={eventForm.is_active} onCheckedChange={(checked) => setEventForm({ ...eventForm, is_active: checked })} />
                    <Label className="text-slate-300">Evento ativo (visível para compra)</Label>
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-6 mt-4">
                  <ImageUploadField 
                    label="Banner (Topo da Página)" 
                    type="banner" 
                    value={eventForm.banner_url}
                    description="Imagem em destaque no topo. Recomendado: 1920x600px"
                  />
                  <Separator className="bg-slate-700" />
                  <ImageUploadField 
                    label="Capa (Card do Evento)" 
                    type="cover" 
                    value={eventForm.cover_url}
                    description="Imagem quadrada para listagens. Recomendado: 600x600px"
                  />
                  <Separator className="bg-slate-700" />
                  <ImageUploadField 
                    label="Mapa do Evento (Setores)" 
                    type="event_map" 
                    value={eventForm.event_map_url}
                    description="Imagem do mapa com os setores do evento"
                  />
                </TabsContent>

                <TabsContent value="social" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-slate-300 flex items-center gap-2"><Instagram className="h-4 w-4" /> Instagram</Label>
                    <Input value={eventForm.instagram_url} onChange={(e) => setEventForm({ ...eventForm, instagram_url: e.target.value })} placeholder="https://instagram.com/..." className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <div>
                    <Label className="text-slate-300 flex items-center gap-2"><Facebook className="h-4 w-4" /> Facebook</Label>
                    <Input value={eventForm.facebook_url} onChange={(e) => setEventForm({ ...eventForm, facebook_url: e.target.value })} placeholder="https://facebook.com/..." className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <div>
                    <Label className="text-slate-300 flex items-center gap-2"><Youtube className="h-4 w-4" /> YouTube</Label>
                    <Input value={eventForm.youtube_url} onChange={(e) => setEventForm({ ...eventForm, youtube_url: e.target.value })} placeholder="https://youtube.com/..." className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                </TabsContent>

                <TabsContent value="location" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-slate-300 flex items-center gap-2"><MapPin className="h-4 w-4" /> Google Maps Embed URL</Label>
                    <Textarea 
                      value={eventForm.google_maps_embed} 
                      onChange={(e) => setEventForm({ ...eventForm, google_maps_embed: e.target.value })} 
                      placeholder="Cole a URL de embed do Google Maps aqui..." 
                      className="bg-slate-700 border-slate-600 text-white" 
                      rows={3}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Vá ao Google Maps → Compartilhar → Incorporar mapa → Copie apenas a URL do src
                    </p>
                  </div>
                  {eventForm.google_maps_embed && (
                    <div className="rounded-lg overflow-hidden border border-slate-600">
                      <iframe 
                        src={eventForm.google_maps_embed} 
                        width="100%" 
                        height="300" 
                        style={{ border: 0 }} 
                        allowFullScreen 
                        loading="lazy"
                      />
                    </div>
                  )}
                  <ImageUploadField 
                    label="Imagem do Mapa (Alternativa)" 
                    type="map" 
                    value={eventForm.map_url}
                    description="Imagem estática do mapa (se não usar embed)"
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
                <Button variant="outline" onClick={() => setShowEventDialog(false)} className="border-slate-600">Cancelar</Button>
                <Button onClick={handleSaveEvent} className="bg-emerald-600 hover:bg-emerald-700">Salvar Evento</Button>
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
              <div className="flex gap-4">
                {event.cover_url && (
                  <img src={event.cover_url} alt={event.name} className="w-20 h-20 rounded-lg object-cover" />
                )}
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    {event.name}
                    {event.is_active ? (
                      <Badge className="bg-emerald-600"><Eye className="h-3 w-3 mr-1" />Ativo</Badge>
                    ) : (
                      <Badge variant="secondary"><EyeOff className="h-3 w-3 mr-1" />Inativo</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-slate-400 flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.event_date ? format(new Date(event.event_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.event_time || '-'}</span>
                  </CardDescription>
                  <p className="text-slate-500 text-xs mt-1 flex items-center gap-1"><Link className="h-3 w-3" />/{event.slug}</p>
                </div>
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
              <h4 className="text-white font-medium flex items-center gap-2"><Ticket className="h-4 w-4" />Ingressos ({event.ticket_types?.length || 0})</h4>
              <Button size="sm" onClick={() => openAddTicket(event)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-3 w-3 mr-1" /> Adicionar Ingresso
              </Button>
            </div>
            {event.ticket_types && event.ticket_types.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Setor</TableHead>
                    <TableHead className="text-slate-400">Tipo</TableHead>
                    <TableHead className="text-slate-400">Lote</TableHead>
                    <TableHead className="text-slate-400">Preço</TableHead>
                    <TableHead className="text-slate-400">Taxa</TableHead>
                    <TableHead className="text-slate-400">Total</TableHead>
                    <TableHead className="text-slate-400">Qtd</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {event.ticket_types.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((ticket) => (
                    <TableRow key={ticket.id} className="border-slate-700">
                      <TableCell className="text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ticket.color }} />
                          {ticket.sector}
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{ticket.name}</TableCell>
                      <TableCell className="text-slate-400">{ticket.batch || 'Lote 1'}</TableCell>
                      <TableCell className="text-white">{formatCurrency(ticket.price)}</TableCell>
                      <TableCell className="text-slate-400">{formatCurrency(ticket.fee || 0)}</TableCell>
                      <TableCell className="text-emerald-400 font-medium">{formatCurrency(ticket.price + (ticket.fee || 0))}</TableCell>
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
              <p className="text-slate-500 text-sm text-center py-4">Nenhum ingresso cadastrado. Clique em "Adicionar Ingresso" para começar.</p>
            )}
          </CardContent>
        </Card>
      ))}

      {events.length === 0 && !loading && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-12 text-center">
            <Ticket className="h-16 w-16 mx-auto text-slate-500 mb-4" />
            <p className="text-slate-400 text-lg">Nenhum evento cadastrado</p>
            <p className="text-slate-500 text-sm mb-4">Clique em "Novo Evento" para criar seu primeiro evento</p>
            <Button onClick={() => setShowEventDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Criar Primeiro Evento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ticket Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={(open) => { setShowTicketDialog(open); if (!open) { resetTicketForm(); setSelectedEvent(null); } }}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedTicket ? "Editar Ingresso" : "Novo Ingresso"}</DialogTitle>
            <DialogDescription className="text-slate-400">{selectedEvent?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Setor *</Label>
                <Input value={ticketForm.sector} onChange={(e) => setTicketForm({ ...ticketForm, sector: e.target.value })} placeholder="Ex: Arena, VIP, Camarote" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Tipo *</Label>
                <Input value={ticketForm.name} onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })} placeholder="Ex: Inteira, Meia, Solidário" className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Descrição</Label>
              <Textarea value={ticketForm.description} onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })} placeholder="Ex: Open Bar, Visão frontal do palco..." className="bg-slate-700 border-slate-600 text-white" rows={2} />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label className="text-slate-300">Preço (R$) *</Label>
                <Input type="number" step="0.01" value={ticketForm.price} onChange={(e) => setTicketForm({ ...ticketForm, price: e.target.value })} placeholder="0.00" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Taxa (R$)</Label>
                <Input type="number" step="0.01" value={ticketForm.fee} onChange={(e) => setTicketForm({ ...ticketForm, fee: e.target.value })} placeholder="0.00" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Quantidade *</Label>
                <Input type="number" value={ticketForm.available} onChange={(e) => setTicketForm({ ...ticketForm, available: e.target.value })} placeholder="100" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Ordem</Label>
                <Input type="number" value={ticketForm.sort_order} onChange={(e) => setTicketForm({ ...ticketForm, sort_order: e.target.value })} placeholder="0" className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Lote</Label>
                <Input value={ticketForm.batch} onChange={(e) => setTicketForm({ ...ticketForm, batch: e.target.value })} placeholder="Ex: Lote 1" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Cor do Setor</Label>
                <div className="flex gap-2">
                  <Input type="color" value={ticketForm.color} onChange={(e) => setTicketForm({ ...ticketForm, color: e.target.value })} className="bg-slate-700 border-slate-600 w-14 h-10 p-1" />
                  <Input value={ticketForm.color} onChange={(e) => setTicketForm({ ...ticketForm, color: e.target.value })} className="bg-slate-700 border-slate-600 text-white flex-1" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch checked={ticketForm.is_active} onCheckedChange={(checked) => setTicketForm({ ...ticketForm, is_active: checked })} />
              <Label className="text-slate-300">Ingresso ativo (disponível para compra)</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowTicketDialog(false)} className="border-slate-600">Cancelar</Button>
            <Button onClick={handleSaveTicket} className="bg-emerald-600 hover:bg-emerald-700">Salvar Ingresso</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventManager;
