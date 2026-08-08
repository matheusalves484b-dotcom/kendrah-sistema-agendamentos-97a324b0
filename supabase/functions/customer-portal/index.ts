import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

async function stripe(path: string, method = 'GET', body?: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${Deno.env.get('STRIPE_LIVE_API_KEY')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? 'Erro no Stripe');
  return json;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const customers = await stripe(`customers?email=${encodeURIComponent(user.email)}&limit=1`);
    const customerId = customers.data?.[0]?.id;
    if (!customerId) {
      return new Response(JSON.stringify({ error: 'Nenhuma assinatura encontrada para este e-mail' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const origin = req.headers.get('origin') ?? 'https://kendrah-sistema-agendamentos.lovable.app';
    const session = await stripe('billing_portal/sessions', 'POST', {
      customer: customerId,
      return_url: `${origin}/dashboard/subscription`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
