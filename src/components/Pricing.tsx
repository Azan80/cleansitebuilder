"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Hacker",
    price: "0",
    description: "For hobbyists and experiments.",
    features: ["5 AI Generations/day", "Public Projects", "Community Support"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "29",
    description: "For shipping real products.",
    features: ["Unlimited Generations", "Custom Domains", "Private Repos", "Export Code"],
    highlight: true,
  },
  {
    name: "Team",
    price: "99",
    description: "For agencies and startups.",
    features: ["Everything in Pro", "Team Seats", "Priority Support", "White Labeling"],
    highlight: false,
  },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-32 bg-[#030712] relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-white mb-6">Start building for free.</h2>
          <p className="text-gray-400">Upgrade when you're ready to ship to production.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-3xl border ${
                plan.highlight
                  ? "bg-white/5 border-indigo-500/50 shadow-2xl shadow-indigo-500/10"
                  : "bg-transparent border-white/10"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-500 text-white text-xs font-bold uppercase tracking-wide rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </div>
              )}

              <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <p className="text-gray-400 text-sm mb-8">{plan.description}</p>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className={`w-4 h-4 ${plan.highlight ? "text-indigo-400" : "text-gray-600"}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  plan.highlight
                    ? "bg-white text-black hover:bg-gray-200"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Choose {plan.name}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
