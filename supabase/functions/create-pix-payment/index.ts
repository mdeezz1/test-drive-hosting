import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  amount: number;
  customerName: string;
  customerEmail: string;
  customerCpf: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get('FREEPAY_PUBLIC_KEY');
    const secretKey = Deno.env.get('FREEPAY_SECRET_KEY');

    if (!publicKey || !secretKey) {
      console.error('Missing FreePay API credentials');
      return new Response(
        JSON.stringify({ error: 'Missing API credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, customerName, customerEmail, customerCpf, customerPhone, items }: PaymentRequest = await req.json();

    console.log('Creating PIX payment:', { amount, customerName, customerEmail, itemsCount: items.length });

    // Create Basic Auth header
    const credentials = btoa(`${publicKey}:${secretKey}`);

    // Generate unique transaction ID
    const transactionId = `PIX_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Build description from items
    const description = items.map(item => `${item.quantity}x ${item.name}`).join(', ');

    // Call FreePay API
    const freePayResponse = await fetch('https://api.freepaybrasil.com/v1/payment-transaction/create', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        payment_method: 'pix',
        external_id: transactionId,
        description: description.substring(0, 255),
        customer: {
          name: customerName,
          email: customerEmail,
          document: customerCpf,
          phone: customerPhone,
        },
        pix: {
          expires_in: 1800, // 30 minutes in seconds
        }
      }),
    });

    const freePayData = await freePayResponse.json();

    console.log('FreePay response status:', freePayResponse.status);
    console.log('FreePay response data:', JSON.stringify(freePayData));

    if (!freePayResponse.ok) {
      console.error('FreePay API error:', freePayData);
      return new Response(
        JSON.stringify({ error: 'Failed to create PIX payment', details: freePayData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract QR Code and copy/paste code from FreePay response
    const qrCode = freePayData.pix?.qr_code_url || freePayData.qr_code_url || freePayData.qrcode_url;
    const copiaCola = freePayData.pix?.qr_code || freePayData.qr_code || freePayData.copy_paste || freePayData.pix_code;

    if (!qrCode || !copiaCola) {
      console.error('Missing QR code data in response:', freePayData);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response from payment provider',
          debug: freePayData 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        qrCode,
        copiaCola,
        transactionId,
        status: freePayData.status || 'PENDING',
        externalId: freePayData.id || freePayData.transaction_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-pix-payment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
