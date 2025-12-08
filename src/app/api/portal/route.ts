import { createClient } from "@/utils/supabase/server";
import { CustomerPortal } from "@polar-sh/nextjs";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  getCustomerId: async (req) => {
    // Get the current user's Polar customer ID from your database
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Not authenticated");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("polar_customer_id")
      .eq("id", user.id)
      .single();

    return profile?.polar_customer_id || "";
  },
  server: "sandbox", // Change to "production" when going live
});
