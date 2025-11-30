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

    // Build items array for FreePay
    const freePayItems = items.map(item => ({
      title: item.name,
      unit_price: Math.round(item.price * 100), // Convert to cents
      quantity: item.quantity,
      tangible: false,
      external_ref: transactionId
    }));

    // Build request body with correct snake_case format
    const requestBody = {
      payment_method: 'pix',
      customer: {
        document: {
          type: 'cpf',
          number: customerCpf.replace(/\D/g, ''), // Remove non-digits
        },
        name: customerName,
        email: customerEmail,
        phone: customerPhone.replace(/\D/g, ''), // Remove non-digits
      },
      items: freePayItems,
      metadata: {
        provider_name: 'GuicheWeb',
        source: 'guicheweb',
        event: 'ahh-verao'
      },
      amount: Math.round(amount * 100), // Convert to cents
      postback_url: 'https://urktmzyjqcsuiyizumom.supabase.co/functions/v1/pix-webhook',
      ip: '127.0.0.1',
      installments: 1,
      pix: {
        expires_in_days: 1
      }
    };

    console.log('Request body:', JSON.stringify(requestBody));

    // Call FreePay API
    const freePayResponse = await fetch('https://api.freepaybrasil.com/v1/payment-transaction/create', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('FreePay response status:', freePayResponse.status);
    
    const responseText = await freePayResponse.text();
    console.log('FreePay response text:', responseText);
    
    let freePayData;
    try {
      freePayData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid response from payment provider', raw: responseText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!freePayResponse.ok || !freePayData.success) {
      console.error('FreePay API error:', freePayData);
      return new Response(
        JSON.stringify({ error: 'Failed to create PIX payment', details: freePayData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract QR Code from FreePay response (data.pix.qr_code)
    const pixData = freePayData.data?.pix;
    const copiaCola = pixData?.qr_code;

    if (!copiaCola) {
      console.error('Missing QR code data in response:', freePayData);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response from payment provider',
          debug: freePayData 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate QR code URL from the PIX code (we'll use a QR code API)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(copiaCola)}`;

    return new Response(
      JSON.stringify({
        qrCode: qrCodeUrl,
        copiaCola,
        transactionId,
        status: freePayData.data?.status || 'PENDING',
        externalId: freePayData.data?.id
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
