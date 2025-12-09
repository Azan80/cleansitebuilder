import { Webhooks } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";

// Create admin Supabase client that bypasses RLS
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log("[POLAR WEBHOOK] Supabase URL:", url ? "Set" : "MISSING!");
  console.log("[POLAR WEBHOOK] Service Role Key:", serviceRoleKey ? "Set" : "MISSING!");
  
  if (!url || !serviceRoleKey) {
    console.error("[POLAR WEBHOOK] Missing Supabase credentials");
    throw new Error("Missing Supabase credentials");
  }
  
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper to find and update user
async function updateUserSubscription(
  customerEmail: string,
  customerId: string | undefined,
  subscriptionData: {
    status: string;
    plan: string | null;
    subscriptionId: string | null;
    endsAt: string | null;
  }
) {
  console.log("[POLAR] Updating subscription for:", customerEmail);
  console.log("[POLAR] Subscription data:", JSON.stringify(subscriptionData));

  const supabaseAdmin = getSupabaseAdmin();

  // First, try to find profile by email
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, email")
    .eq("email", customerEmail);

  if (profileError) {
    console.error("[POLAR] Error querying profiles:", profileError.message);
  }

  if (profiles && profiles.length > 0) {
    const profile = profiles[0];
    console.log("[POLAR] Found profile:", profile.id);
    
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: subscriptionData.status,
        subscription_plan: subscriptionData.plan,
        subscription_id: subscriptionData.subscriptionId,
        subscription_ends_at: subscriptionData.endsAt,
        polar_customer_id: customerId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("[POLAR] Error updating profile:", updateError.message);
      return false;
    }
    
    console.log("[POLAR] Successfully updated profile:", profile.id);
    return true;
  }

  console.log("[POLAR] Profile not found by email, checking auth.users...");

  // If profile not found, try to find user in auth.users and create profile
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error("[POLAR] Error listing users:", authError.message);
      return false;
    }

    const authUser = authData?.users?.find(u => u.email === customerEmail);
    
    if (!authUser) {
      console.error("[POLAR] User not found in auth.users for email:", customerEmail);
      return false;
    }

    console.log("[POLAR] Found auth user:", authUser.id);

    // Insert new profile
    const { error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authUser.id,
        email: customerEmail,
        subscription_status: subscriptionData.status,
        subscription_plan: subscriptionData.plan,
        subscription_id: subscriptionData.subscriptionId,
        subscription_ends_at: subscriptionData.endsAt,
        polar_customer_id: customerId || null,
        generation_count: 0,
        generation_reset_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("[POLAR] Error inserting profile:", insertError.message);
      
      // Maybe profile exists, try update instead
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: subscriptionData.status,
          subscription_plan: subscriptionData.plan,
          subscription_id: subscriptionData.subscriptionId,
          subscription_ends_at: subscriptionData.endsAt,
          polar_customer_id: customerId || null,
        })
        .eq("id", authUser.id);

      if (updateError) {
        console.error("[POLAR] Error updating profile after insert failed:", updateError.message);
        return false;
      }
    }

    console.log("[POLAR] Successfully created/updated profile for user:", authUser.id);
    return true;
  } catch (error) {
    console.error("[POLAR] Error in updateUserSubscription:", error);
    return false;
  }
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onPayload: async (payload) => {
    // Log all incoming webhooks for debugging
    console.log("=".repeat(50));
    console.log("[POLAR WEBHOOK] Received event type:", payload.type);
    console.log("[POLAR WEBHOOK] Event data:", JSON.stringify(payload.data, null, 2));
    console.log("=".repeat(50));
  },
  
  onSubscriptionActive: async (payload) => {
    console.log("[POLAR] === SUBSCRIPTION ACTIVE ===");
    
    try {
      const subscription = payload.data;
      const customerEmail = subscription.customer?.email;
      const customerId = subscription.customer?.id;
      
      if (!customerEmail) {
        console.error("[POLAR] No customer email in subscription payload");
        return;
      }

      await updateUserSubscription(customerEmail, customerId, {
        status: "active",
        plan: subscription.product?.name || "Starter",
        subscriptionId: subscription.id,
        endsAt: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toISOString() : null,
      });
    } catch (error) {
      console.error("[POLAR] Error in onSubscriptionActive:", error);
    }
  },

  onSubscriptionCreated: async (payload) => {
    console.log("[POLAR] === SUBSCRIPTION CREATED ===");
    
    try {
      const subscription = payload.data;
      const customerEmail = subscription.customer?.email;
      const customerId = subscription.customer?.id;
      
      if (!customerEmail) {
        console.error("[POLAR] No customer email in subscription payload");
        return;
      }

      const status = subscription.status === "active" ? "active" : "pending";

      await updateUserSubscription(customerEmail, customerId, {
        status: status,
        plan: subscription.product?.name || "Starter",
        subscriptionId: subscription.id,
        endsAt: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toISOString() : null,
      });
    } catch (error) {
      console.error("[POLAR] Error in onSubscriptionCreated:", error);
    }
  },

  onSubscriptionCanceled: async (payload) => {
    console.log("[POLAR] === SUBSCRIPTION CANCELED ===");
    
    try {
      const subscription = payload.data;
      const customerEmail = subscription.customer?.email;
      const customerId = subscription.customer?.id;
      
      if (!customerEmail) {
        console.error("[POLAR] No customer email");
        return;
      }

      await updateUserSubscription(customerEmail, customerId, {
        status: "canceled",
        plan: subscription.product?.name || null,
        subscriptionId: subscription.id,
        endsAt: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toISOString() : null,
      });
    } catch (error) {
      console.error("[POLAR] Error in onSubscriptionCanceled:", error);
    }
  },

  onSubscriptionRevoked: async (payload) => {
    console.log("[POLAR] === SUBSCRIPTION REVOKED ===");
    
    try {
      const subscription = payload.data;
      const customerEmail = subscription.customer?.email;
      
      if (!customerEmail) {
        return;
      }

      await updateUserSubscription(customerEmail, undefined, {
        status: "expired",
        plan: null,
        subscriptionId: null,
        endsAt: null,
      });
    } catch (error) {
      console.error("[POLAR] Error in onSubscriptionRevoked:", error);
    }
  },

  onOrderPaid: async (payload) => {
    console.log("[POLAR] === ORDER PAID ===");
    console.log("[POLAR] Order ID:", payload.data.id);
    console.log("[POLAR] Customer email:", payload.data.customer?.email);
  },

  onCheckoutCreated: async (payload) => {
    console.log("[POLAR] Checkout created:", payload.data.id);
  },

  onCheckoutUpdated: async (payload) => {
    console.log("[POLAR] Checkout updated:", payload.data.id, "Status:", payload.data.status);
  },
});
