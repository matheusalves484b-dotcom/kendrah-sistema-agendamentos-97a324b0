import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

async function stripe(path: string) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${Deno.env.get('STRIPE_LIVE_API_KEY')}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? 'Erro no Stripe');
  return json;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const { data: userData, error: userError } = await authClient.auth.getUser();
    const user = userData?.user;
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const customers = await stripe(`customers?email=${encodeURIComponent(user.email)}&limit=1`);
    const customerId: string | undefined = customers.data?.[0]?.id;

    let status = 'none';
    let currentPeriodEnd: string | null = null;
    let trialEnd: string | null = null;

    if (customerId) {
      const subs = await stripe(`subscriptions?customer=${customerId}&status=all&limit=10`);
      const sub = (subs.data ?? []).find((s: any) =>
        ['active', 'trialing', 'past_due'].includes(s.status),
      );
      if (sub) {
        status = sub.status === 'past_due' ? 'past_due' : sub.status === 'trialing' ? 'trialing' : 'active';
        currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
        trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
      } else if ((subs.data ?? []).length > 0) {
        status = 'canceled';
      }
    }

    await admin.from('subscribers').upsert(
      {
        user_id: user.id,
        email: user.email,
        stripe_customer_id: customerId ?? null,
        status,
        current_period_end: currentPeriodEnd,
        trial_end: trialEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    return new Response(
      JSON.stringify({
        status,
        subscribed: status === 'active' || status === 'trialing',
        current_period_end: currentPeriodEnd,
        trial_end: trialEnd,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
