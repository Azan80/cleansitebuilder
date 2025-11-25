"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Code, Globe, Zap, Layout, Lock } from "lucide-react";

const features = [
  {
    icon: <Sparkles className="w-6 h-6 text-indigo-400" />,
    title: "Natural Language to UI",
    description: "Describe your interface in plain English. Our LLM understands context, aesthetics, and UX patterns.",
    colSpan: 2,
  },
  {
    icon: <Code className="w-6 h-6 text-blue-400" />,
    title: "Clean React Code",
    description: "We don't output spaghetti code. You get clean, semantic, component-based React & Tailwind.",
    colSpan: 1,
  },
  {
    icon: <Globe className="w-6 h-6 text-green-400" />,
    title: "Instant Hosting",
    description: "Every project gets a live URL instantly. Share with your team or clients in seconds.",
    colSpan: 1,
  },
  {
    icon: <Layout className="w-6 h-6 text-purple-400" />,
    title: "Responsive by Default",
    description: "All generated layouts are mobile-first and fully responsive across all devices.",
    colSpan: 2,
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    title: "Real-time Iteration",
    description: "Don't like the header? Just say 'Make the header sticky and dark'. It updates instantly.",
    colSpan: 3,
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-32 bg-[#030712] relative">
      <div className="container mx-auto px-6">
        <div className="mb-20 max-w-2xl">
          <h2 className="text-4xl font-bold text-white mb-6">Built for speed.</h2>
          <p className="text-gray-400 text-lg">
            CleanSiteBuilder isn't just a website builder. It's an AI-powered frontend engineer that never sleeps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group relative overflow-hidden ${
                feature.colSpan === 2 ? "md:col-span-2" : feature.colSpan === 3 ? "md:col-span-3" : "md:col-span-1"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="w-12 h-12 rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10 shadow-lg">
                <div className="absolute inset-0 bg-white/5 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 relative z-10">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed relative z-10">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
