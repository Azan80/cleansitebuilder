import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("products");
  const customerEmail = searchParams.get("customerEmail");

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

  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cleansitebuilder.com";
  const successUrl = `${baseUrl}/builder`;
  
  // Use sandbox for testing, production when live
  const polarServer = process.env.POLAR_SERVER === "production" 
    ? "https://buy.polar.sh" 
    : "https://sandbox.polar.sh";
  
  // Build Polar buy link URL
  const checkoutUrl = new URL(`${polarServer}/polar_cl_${productId}`);
  
  // Add success URL
  checkoutUrl.searchParams.set("successUrl", successUrl);
  
  // Auto-fill user email
  const email = customerEmail || user.email;
  if (email) {
    checkoutUrl.searchParams.set("customerEmail", email);
  }
  
  // Add theme
  checkoutUrl.searchParams.set("theme", "dark");

  return NextResponse.redirect(checkoutUrl.toString());
}
