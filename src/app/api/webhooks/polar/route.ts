import { Webhooks } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";

// Lazy create admin Supabase client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  
  onSubscriptionActive: async (payload) => {
    console.log("[POLAR] Subscription activated:", payload.data.id);
    
    const supabaseAdmin = getSupabaseAdmin();
    const subscription = payload.data;
    const customerEmail = subscription.customer?.email;
    
    if (!customerEmail) {
      console.error("[POLAR] No customer email in subscription");
      return;
    }

    // Find user by email
    const { data: user } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", customerEmail)
      .single();

    if (!user) {
      console.log("[POLAR] User not found for email:", customerEmail);
      return;
    }

    // Update user's subscription status
    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_plan: subscription.product?.name || "Pro",
        subscription_id: subscription.id,
        subscription_ends_at: subscription.currentPeriodEnd,
      })
      .eq("id", user.id);

    console.log("[POLAR] Updated subscription for user:", user.id);
  },

  onSubscriptionCanceled: async (payload) => {
    console.log("[POLAR] Subscription canceled:", payload.data.id);
    
    const supabaseAdmin = getSupabaseAdmin();
    const subscription = payload.data;
    
    // Find user by subscription ID
    const { data: user } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("subscription_id", subscription.id)
      .single();

    if (!user) {
      console.log("[POLAR] User not found for subscription:", subscription.id);
      return;
    }

    // Update subscription status
    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "canceled",
        subscription_ends_at: subscription.currentPeriodEnd,
      })
      .eq("id", user.id);

    console.log("[POLAR] Canceled subscription for user:", user.id);
  },

  onSubscriptionRevoked: async (payload) => {
    console.log("[POLAR] Subscription revoked:", payload.data.id);
    
    const supabaseAdmin = getSupabaseAdmin();
    const subscription = payload.data;
    
    // Find user by subscription ID
    const { data: user } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("subscription_id", subscription.id)
      .single();

    if (!user) {
      return;
    }

    // Revoke access
    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "expired",
        subscription_plan: null,
      })
      .eq("id", user.id);

    console.log("[POLAR] Revoked subscription for user:", user.id);
  },

  onOrderPaid: async (payload) => {
    console.log("[POLAR] Order paid:", payload.data.id);
    // Handle one-time purchases if needed
  },
});
