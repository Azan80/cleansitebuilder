"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Code2, Rocket, ArrowRight } from "lucide-react";

const steps = [
  {
    id: "01",
    icon: <MessageSquare className="w-6 h-6 text-white" />,
    title: "Prompt your Website",
    description: "Describe your dream website. 'A portfolio for a photographer with a gallery, about page, and contact form.'",
    color: "bg-blue-500",
  },
  {
    id: "02",
    icon: <Code2 className="w-6 h-6 text-white" />,
    title: "AI Builds & Optimizes",
    description: "Trogan generates production-ready Next.js code, fully optimized for SEO, performance, and mobile responsiveness.",
    color: "bg-purple-500",
  },
  {
    id: "03",
    icon: <Rocket className="w-6 h-6 text-white" />,
    title: "Deploy Instantly",
    description: "One click to launch your site to a global edge network. Connect your custom domain and start collecting leads immediately.",
    color: "bg-pink-500",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-32 bg-[#030712] relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-mono mb-6"
          >
            <span>WORKFLOW_V2.0</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">From prompt to production.</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            A streamlined, industrial-grade workflow designed for speed and precision.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-px bg-white/10">
            <motion.div 
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-white/30"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.3 }}
                className="relative group"
              >
                {/* Step Number & Icon */}
                <div className="flex flex-col items-center mb-8 relative">
                  <div className="w-24 h-24 bg-[#0a0a0a] border border-white/10 rounded-2xl flex items-center justify-center relative z-10 group-hover:border-white/30 transition-colors duration-500">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {/* Animated Border Beam */}
                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                       <div className="absolute top-0 left-0 w-full h-full border-2 border-white/0 group-hover:border-white/10 transition-all duration-500" />
                    </div>
                    <div className="text-white group-hover:scale-110 transition-transform duration-500">
                      {step.icon}
                    </div>
                    <div className="absolute -top-3 -right-3 bg-[#111] border border-white/10 px-2 py-1 rounded text-[10px] font-mono text-gray-400 group-hover:text-white group-hover:border-white/30 transition-colors">
                      {step.id}
                    </div>
                  </div>
                  
                  {/* Vertical Line for Mobile */}
                  <div className="md:hidden h-12 w-px bg-white/10 my-4" />
                </div>

                {/* Content Card */}
                <div className="text-center relative p-6 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-300">
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {step.description}
                  </p>
                  
                  {/* Corner Accents */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
