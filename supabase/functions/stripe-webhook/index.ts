import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const encoder = new TextEncoder();

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Verifies Stripe's `Stripe-Signature` header (scheme v1). */
async function verifySignature(body: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const timestamp = parts.find((p) => p[0] === 't')?.[1];
  const signatures = parts.filter((p) => p[0] === 'v1').map((p) => p[1]);
  if (!timestamp || signatures.length === 0) return false;

  // Reject events older than 5 minutes (replay protection).
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = await hmacHex(secret, `${timestamp}.${body}`);
  return signatures.some((s) => timingSafeEqual(s, expected));
}

async function stripeGet(path: string) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${Deno.env.get('STRIPE_LIVE_API_KEY')}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? 'Erro no Stripe');
  return json;
}

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

function mapStatus(stripeStatus: string) {
  switch (stripeStatus) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    default:
      return 'canceled';
  }
}

const iso = (seconds?: number | null) =>
  seconds ? new Date(seconds * 1000).toISOString() : null;

async function syncSubscription(customerId: string, subscription: any) {
  const customer = await stripeGet(`customers/${customerId}`);
  const email: string | undefined = customer?.email ?? undefined;
  if (!email) return { skipped: 'customer sem e-mail' };

  const record = {
    email,
    stripe_customer_id: customerId,
    status: subscription ? mapStatus(subscription.status) : 'canceled',
    current_period_end: iso(subscription?.current_period_end),
    trial_end: iso(subscription?.trial_end),
    updated_at: new Date().toISOString(),
  };

  // Prefer the existing row for this customer/email; otherwise resolve the auth user.
  const { data: existing } = await admin
    .from('subscribers')
    .select('user_id')
    .or(`stripe_customer_id.eq.${customerId},email.eq.${email}`)
    .maybeSingle();

  let userId = existing?.user_id as string | undefined;

  if (!userId) {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    userId = list?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    )?.id;
  }
  if (!userId) return { skipped: 'nenhum usuário com este e-mail' };

  const { error } = await admin
    .from('subscribers')
    .upsert({ user_id: userId, ...record }, { onConflict: 'user_id' });
  if (error) throw error;

  return { user_id: userId, status: record.status };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret) {
    return new Response(JSON.stringify({ error: 'STRIPE_WEBHOOK_SECRET não configurado' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const body = await req.text();
  const valid = await verifySignature(body, req.headers.get('Stripe-Signature'), secret);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Assinatura inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const event = JSON.parse(body);
    const object = event.data?.object ?? {};
    let result: unknown = { ignored: event.type };

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.trial_will_end':
        result = await syncSubscription(object.customer, object);
        break;

      case 'checkout.session.completed': {
        if (object.mode === 'subscription' && object.subscription) {
          const sub = await stripeGet(`subscriptions/${object.subscription}`);
          result = await syncSubscription(sub.customer, sub);
        }
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_failed': {
        if (object.subscription) {
          const sub = await stripeGet(`subscriptions/${object.subscription}`);
          result = await syncSubscription(sub.customer, sub);
        }
        break;
      }
    }

    console.log('stripe-webhook handled', event.type, JSON.stringify(result));

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('stripe-webhook error', (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
