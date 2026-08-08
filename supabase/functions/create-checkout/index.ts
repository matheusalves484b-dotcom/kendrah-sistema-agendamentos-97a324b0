import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const PLAN_AMOUNT = 3990; // R$ 39,90
const PLAN_CURRENCY = 'brl';
const TRIAL_DAYS = 7;

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

async function resolvePriceId(): Promise<string> {
  const prices = await stripe('prices?active=true&type=recurring&limit=100');
  const match = (prices.data ?? []).find(
    (p: any) =>
      p.currency === PLAN_CURRENCY &&
      p.unit_amount === PLAN_AMOUNT &&
      p.recurring?.interval === 'month',
  );
  if (match) return match.id;

  const product = await stripe('products', 'POST', { name: 'Plano Kendrah Mensal' });
  const price = await stripe('prices', 'POST', {
    'unit_amount': String(PLAN_AMOUNT),
    'currency': PLAN_CURRENCY,
    'recurring[interval]': 'month',
    'product': product.id,
  });
  return price.id;
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

    const priceId = await resolvePriceId();
    const origin = req.headers.get('origin') ?? 'https://kendrah-sistema-agendamentos.lovable.app';

    const params: Record<string, string> = {
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'subscription_data[trial_period_days]': String(TRIAL_DAYS),
      success_url: `${origin}/dashboard/subscription?checkout=success`,
      cancel_url: `${origin}/dashboard/subscription?checkout=cancel`,
      allow_promotion_codes: 'true',
    };
    if (customerId) params.customer = customerId;
    else params.customer_email = user.email;

    const session = await stripe('checkout/sessions', 'POST', params);

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
