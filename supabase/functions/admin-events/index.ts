import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, data } = await req.json();
    console.log(`Admin events action: ${action}`, data);

    switch (action) {
      case "list_events": {
        const { data: events, error } = await supabase
          .from("events")
          .select("*, ticket_types(*)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, events }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_event": {
        const { data: event, error } = await supabase
          .from("events")
          .select("*, ticket_types(*)")
          .eq("id", data.id)
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, event }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create_event": {
        const { data: event, error } = await supabase
          .from("events")
          .insert({
            name: data.name,
            slug: data.slug,
            description: data.description,
            location: data.location,
            event_date: data.event_date,
            event_time: data.event_time,
            opening_time: data.opening_time,
            banner_url: data.banner_url,
            cover_url: data.cover_url,
            map_url: data.map_url,
            event_map_url: data.event_map_url,
            instagram_url: data.instagram_url,
            facebook_url: data.facebook_url,
            youtube_url: data.youtube_url,
            google_maps_embed: data.google_maps_embed,
            is_active: data.is_active ?? true,
            show_on_home: data.show_on_home ?? true,
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, event }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_event": {
        const { data: event, error } = await supabase
          .from("events")
          .update({
            name: data.name,
            slug: data.slug,
            description: data.description,
            location: data.location,
            event_date: data.event_date,
            event_time: data.event_time,
            opening_time: data.opening_time,
            banner_url: data.banner_url,
            cover_url: data.cover_url,
            map_url: data.map_url,
            event_map_url: data.event_map_url,
            instagram_url: data.instagram_url,
            facebook_url: data.facebook_url,
            youtube_url: data.youtube_url,
            google_maps_embed: data.google_maps_embed,
            is_active: data.is_active,
            show_on_home: data.show_on_home,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, event }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_event": {
        const { error } = await supabase
          .from("events")
          .delete()
          .eq("id", data.id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create_ticket_type": {
        const { data: ticketType, error } = await supabase
          .from("ticket_types")
          .insert({
            event_id: data.event_id,
            sector: data.sector,
            name: data.name,
            description: data.description,
            price: data.price,
            fee: data.fee,
            available: data.available,
            color: data.color,
            batch: data.batch,
            sort_order: data.sort_order,
            is_active: data.is_active ?? true,
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, ticketType }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_ticket_type": {
        const { data: ticketType, error } = await supabase
          .from("ticket_types")
          .update({
            sector: data.sector,
            name: data.name,
            description: data.description,
            price: data.price,
            fee: data.fee,
            available: data.available,
            color: data.color,
            batch: data.batch,
            sort_order: data.sort_order,
            is_active: data.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, ticketType }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_ticket_type": {
        const { error } = await supabase
          .from("ticket_types")
          .delete()
          .eq("id", data.id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ success: false, error: "Ação inválida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
