import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to send order to Utmify
async function sendToUtmify(orderData: {
  orderId: string;
  status: 'waiting_payment' | 'paid' | 'refused' | 'refunded';
  createdAt: string;
  approvedDate: string | null;
  refundedAt: string | null;
  customer: {
    name: string;
    email: string;
    phone: string;
    document: string;
  };
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    priceInCents: number;
  }>;
  totalPriceInCents: number;
  gatewayFeeInCents: number;
}) {
  const utmifyApiKey = Deno.env.get('UTMIFY_API_KEY');
  
  if (!utmifyApiKey) {
    console.error('UTMIFY_API_KEY not configured');
    return { success: false, error: 'Missing API key' };
  }

  const utmifyPayload = {
    orderId: orderData.orderId,
    platform: 'GuicheWeb',
    paymentMethod: 'pix',
    status: orderData.status,
    createdAt: orderData.createdAt,
    approvedDate: orderData.approvedDate,
    refundedAt: orderData.refundedAt,
    customer: {
      name: orderData.customer.name,
      email: orderData.customer.email,
      phone: orderData.customer.phone,
      document: orderData.customer.document,
      country: 'BR'
    },
    products: orderData.products.map(p => ({
      id: p.id,
      name: p.name,
      planId: null,
      planName: null,
      quantity: p.quantity,
      priceInCents: p.priceInCents
    })),
    trackingParameters: {
      src: null,
      sck: null,
      utm_source: null,
      utm_campaign: null,
      utm_medium: null,
      utm_content: null,
      utm_term: null
    },
    commission: {
      totalPriceInCents: orderData.totalPriceInCents,
      gatewayFeeInCents: orderData.gatewayFeeInCents,
      userCommissionInCents: orderData.totalPriceInCents - orderData.gatewayFeeInCents
    }
  };

  console.log('Sending to Utmify:', JSON.stringify(utmifyPayload));

  try {
    const response = await fetch('https://api.utmify.com.br/api-credentials/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': utmifyApiKey
      },
      body: JSON.stringify(utmifyPayload)
    });

    const responseText = await response.text();
    console.log('Utmify response status:', response.status);
    console.log('Utmify response:', responseText);

    return { 
      success: response.ok, 
      status: response.status,
      response: responseText 
    };
  } catch (error) {
    console.error('Error sending to Utmify:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    console.log('Received FreePay webhook:', JSON.stringify(payload));

    // FreePay webhook payload structure
    const transactionId = payload.id || payload.transaction_id || payload.data?.id;
    const status = payload.status || payload.data?.status;
    const amount = payload.amount || payload.data?.amount;

    console.log('Parsed webhook data:', { transactionId, status, amount });

    // Check if payment was confirmed (PAID status)
    if (status === 'PAID' || status === 'paid' || status === 'approved') {
      console.log('Payment confirmed! Transaction:', transactionId);
      
      // Extract customer and product data from metadata if available
      const metadata = payload.metadata || payload.data?.metadata || {};
      const customer = payload.customer || payload.data?.customer || {};
      
      // Send paid notification to Utmify
      const utmifyResult = await sendToUtmify({
        orderId: transactionId,
        status: 'paid',
        createdAt: metadata.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
        approvedDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        refundedAt: null,
        customer: {
          name: customer.name || metadata.customerName || 'Cliente',
          email: customer.email || metadata.customerEmail || '',
          phone: customer.phone || metadata.customerPhone || '',
          document: customer.document?.number || metadata.customerCpf || ''
        },
        products: metadata.products || [{
          id: 'ticket',
          name: 'Ingresso Ahh Verão',
          quantity: 1,
          priceInCents: amount
        }],
        totalPriceInCents: amount,
        gatewayFeeInCents: Math.round(amount * 0.0299) // ~3% fee estimate
      });

      console.log('Utmify paid notification result:', utmifyResult);

      return new Response(
        JSON.stringify({ 
          received: true, 
          status: 'paid',
          transactionId,
          utmifyNotified: utmifyResult.success
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle refunded status
    if (status === 'REFUNDED' || status === 'refunded') {
      console.log('Payment refunded! Transaction:', transactionId);
      
      const metadata = payload.metadata || payload.data?.metadata || {};
      const customer = payload.customer || payload.data?.customer || {};

      const utmifyResult = await sendToUtmify({
        orderId: transactionId,
        status: 'refunded',
        createdAt: metadata.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
        approvedDate: metadata.approvedDate || null,
        refundedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        customer: {
          name: customer.name || metadata.customerName || 'Cliente',
          email: customer.email || metadata.customerEmail || '',
          phone: customer.phone || metadata.customerPhone || '',
          document: customer.document?.number || metadata.customerCpf || ''
        },
        products: metadata.products || [{
          id: 'ticket',
          name: 'Ingresso Ahh Verão',
          quantity: 1,
          priceInCents: amount
        }],
        totalPriceInCents: amount,
        gatewayFeeInCents: Math.round(amount * 0.0299)
      });

      console.log('Utmify refunded notification result:', utmifyResult);

      return new Response(
        JSON.stringify({ 
          received: true, 
          status: 'refunded',
          transactionId,
          utmifyNotified: utmifyResult.success
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For other statuses, just acknowledge receipt
    return new Response(
      JSON.stringify({ 
        received: true, 
        status: status || 'unknown',
        transactionId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
