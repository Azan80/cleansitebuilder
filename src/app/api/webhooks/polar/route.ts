import { Webhooks } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";

// Create admin Supabase client that bypasses RLS
// IMPORTANT: Use SUPABASE_SERVICE_ROLE_KEY for webhook operations
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
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

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  
  // Called when subscription becomes active (new or renewed)
  onSubscriptionActive: async (payload) => {
    console.log("[POLAR] Subscription activated:", JSON.stringify(payload.data, null, 2));
    
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const subscription = payload.data;
      const customerEmail = subscription.customer?.email;
      const customerId = subscription.customer?.id;
      
      if (!customerEmail) {
        console.error("[POLAR] No customer email in subscription");
        return;
      }

      console.log("[POLAR] Looking for user with email:", customerEmail);

      // Find user by email in profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .eq("email", customerEmail)
        .single();

      if (profileError || !profile) {
        console.log("[POLAR] Profile not found, trying auth.users email:", profileError?.message);
        
        // Try to find by auth user email
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = authUsers?.users?.find(u => u.email === customerEmail);
        
        if (!authUser) {
          console.error("[POLAR] User not found for email:", customerEmail);
          return;
        }
        
        // Create or update profile
        const { error: upsertError } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: authUser.id,
            email: customerEmail,
            subscription_status: "active",
            subscription_plan: subscription.product?.name || "Starter",
            subscription_id: subscription.id,
            subscription_ends_at: subscription.currentPeriodEnd,
            polar_customer_id: customerId,
            generation_count: 0,
            generation_reset_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        
        if (upsertError) {
          console.error("[POLAR] Error upserting profile:", upsertError);
        } else {
          console.log("[POLAR] Created/updated profile for user:", authUser.id);
        }
        return;
      }

      // Update existing profile
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_plan: subscription.product?.name || "Starter",
          subscription_id: subscription.id,
          subscription_ends_at: subscription.currentPeriodEnd,
          polar_customer_id: customerId,
        })
        .eq("id", profile.id);

      if (updateError) {
        console.error("[POLAR] Error updating subscription:", updateError);
      } else {
        console.log("[POLAR] Updated subscription for user:", profile.id);
      }
    } catch (error) {
      console.error("[POLAR] Error in onSubscriptionActive:", error);
    }
  },

  // Called when subscription is canceled (still active until end of period)
  onSubscriptionCanceled: async (payload) => {
    console.log("[POLAR] Subscription canceled:", payload.data.id);
    
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const subscription = payload.data;
      
      // Find user by subscription ID
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("subscription_id", subscription.id)
        .single();

      if (!profile) {
        // Try by customer email
        const customerEmail = subscription.customer?.email;
        if (customerEmail) {
          const { data: profileByEmail } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", customerEmail)
            .single();
          
          if (profileByEmail) {
            await supabaseAdmin
              .from("profiles")
              .update({
                subscription_status: "canceled",
                subscription_ends_at: subscription.currentPeriodEnd,
              })
              .eq("id", profileByEmail.id);
            console.log("[POLAR] Canceled subscription for user:", profileByEmail.id);
          }
        }
        return;
      }

      // Update subscription status
      await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: "canceled",
          subscription_ends_at: subscription.currentPeriodEnd,
        })
        .eq("id", profile.id);

      console.log("[POLAR] Canceled subscription for user:", profile.id);
    } catch (error) {
      console.error("[POLAR] Error in onSubscriptionCanceled:", error);
    }
  },

  // Called when subscription is revoked (immediate access removal)
  onSubscriptionRevoked: async (payload) => {
    console.log("[POLAR] Subscription revoked:", payload.data.id);
    
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const subscription = payload.data;
      
      // Find user by subscription ID
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("subscription_id", subscription.id)
        .single();

      if (!profile) {
        return;
      }

      // Revoke access
      await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: "expired",
          subscription_plan: null,
          subscription_id: null,
        })
        .eq("id", profile.id);

      console.log("[POLAR] Revoked subscription for user:", profile.id);
    } catch (error) {
      console.error("[POLAR] Error in onSubscriptionRevoked:", error);
    }
  },

  // Called when an order is paid (one-time or subscription first payment)
  onOrderPaid: async (payload) => {
    console.log("[POLAR] Order paid:", JSON.stringify(payload.data, null, 2));
    
    // The subscription handlers above will handle subscription-related orders
    // This is mainly for one-time purchases or logging
  },

  // Called when checkout is created
  onCheckoutCreated: async (payload) => {
    console.log("[POLAR] Checkout created:", payload.data.id);
  },

  // Called when checkout is updated (e.g., completed)
  onCheckoutUpdated: async (payload) => {
    console.log("[POLAR] Checkout updated:", payload.data.id, "Status:", payload.data.status);
  },
});
