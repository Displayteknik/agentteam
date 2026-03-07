import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const runtime = "nodejs";

// Must use service role for webhook (no user session)
function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function updateSubscription(
  supabase: ReturnType<typeof getServiceSupabase>,
  userId: string,
  data: {
    stripe_subscription_id?: string;
    subscription_status: string;
    subscription_period_end?: Date | null;
  }
) {
  await supabase.from("profiles").update(data).eq("id", userId);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${err}` }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (!userId) break;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      await updateSubscription(supabase, userId, {
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_period_end: new Date((subscription as unknown as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000),
      });
      // Mark onboarding step 1 complete
      await supabase
        .from("progress_steps")
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("step_key", "onboarding_complete");
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;
      await updateSubscription(supabase, userId, {
        subscription_status: sub.status,
        subscription_period_end: new Date((sub as unknown as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000),
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.supabase_user_id;
      if (!userId) break;
      await updateSubscription(supabase, userId, {
        subscription_status: "canceled",
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      const sub = invoice.subscription
        ? await stripe.subscriptions.retrieve(invoice.subscription as string)
        : null;
      const userId = sub?.metadata?.supabase_user_id;
      if (!userId) break;
      await updateSubscription(supabase, userId, { subscription_status: "past_due" });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
