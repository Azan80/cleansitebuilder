import { Navbar } from "@/landingpage/Navbar";
import { Hero } from "@/landingpage/Hero";
import { Features } from "@/landingpage/Features";
import { HowItWorks } from "@/landingpage/HowItWorks";
import { Showcase } from "@/landingpage/Showcase";
import { Pricing } from "@/landingpage/Pricing";
import { Footer } from "@/landingpage/Footer";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#030712] selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Showcase />
      <Pricing />
      
      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712] to-indigo-950/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight text-white">
            Ready to ship?
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join the new standard of web development. Build your dream site in seconds.
          </p>
          <button className="px-10 py-5 bg-white text-black rounded-2xl font-bold text-xl hover:bg-gray-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] hover:-translate-y-1 flex items-center gap-3 mx-auto">
            <Sparkles className="w-6 h-6" />
            Start Building Now
          </button>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
