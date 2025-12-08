import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("products");

  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  // Get the current user's email
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const successUrl = `${baseUrl}/builder`;
  
  // Build Polar checkout URL
  const polarServer = process.env.POLAR_SERVER === "production" 
    ? "https://polar.sh" 
    : "https://sandbox.polar.sh";
  
  const checkoutUrl = new URL(`${polarServer}/checkout`);
  checkoutUrl.searchParams.set("products", productId);
  
  // Auto-fill user email if logged in
  if (user?.email) {
    checkoutUrl.searchParams.set("customerEmail", user.email);
  }
  
  // Add success URL
  checkoutUrl.searchParams.set("successUrl", successUrl);
  
  // Add theme
  checkoutUrl.searchParams.set("theme", "dark");

  return NextResponse.redirect(checkoutUrl.toString());
}
