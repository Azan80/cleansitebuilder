import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment_variables: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      POLAR_WEBHOOK_SECRET: !!process.env.POLAR_WEBHOOK_SECRET,
      POLAR_ACCESS_TOKEN: !!process.env.POLAR_ACCESS_TOKEN,
    },
    supabase_connection: "not tested",
    profiles_table: "not tested",
    sample_profiles: [] as any[],
  };

  // Test Supabase connection
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (url && key) {
      const supabase = createClient(url, key);
      
      // Test connection by fetching profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, subscription_status, subscription_plan")
        .limit(5);

      if (error) {
        checks.supabase_connection = "error";
        checks.profiles_table = `Error: ${error.message}`;
      } else {
        checks.supabase_connection = "connected";
        checks.profiles_table = "accessible";
        checks.sample_profiles = profiles || [];
      }
    } else {
      checks.supabase_connection = "missing credentials";
    }
  } catch (error: any) {
    checks.supabase_connection = `Error: ${error.message}`;
  }

  return NextResponse.json(checks, { status: 200 });
}
