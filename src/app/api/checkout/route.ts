import { createClient } from "@/utils/supabase/server";
import { Checkout } from "@polar-sh/nextjs";
import { NextRequest, NextResponse } from "next/server";

// Create the base checkout handler
const checkoutHandler = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: (process.env.NEXT_PUBLIC_APP_URL || "https://cleansitebuilder.com") + "/builder",
  server: "production", // Change to "production" when going live
});

export async function GET(request: NextRequest) {
  // Check if user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with return URL
    const returnUrl = request.nextUrl.pathname + request.nextUrl.search;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", returnUrl);
    return NextResponse.redirect(loginUrl);
  }

  // If user has email but it's not in the query, add it
  const searchParams = request.nextUrl.searchParams;
  if (user.email && !searchParams.has("customerEmail")) {
    // Clone the URL and add the email
    const newUrl = new URL(request.url);
    newUrl.searchParams.set("customerEmail", user.email);
    
    // Create a new request with the updated URL
    const newRequest = new NextRequest(newUrl, request);
    return checkoutHandler(newRequest);
  }

  // Use the checkout handler from @polar-sh/nextjs
  return checkoutHandler(request);
}
