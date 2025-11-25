"use client";

import React from "react";
import Link from "next/link";
import { Twitter, Github, Linkedin, Sparkles } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-[#030712] border-t border-white/5 pt-24 pb-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Trogan</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              The AI-powered frontend engineer for modern teams.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Product</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Company</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Careers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Legal</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Privacy</Link></li>
              <li><Link href="#" className="hover:text-indigo-400 transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} TroganAI Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
             <Link href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></Link>
             <Link href="#" className="text-gray-400 hover:text-white transition-colors"><Github className="w-5 h-5" /></Link>
             <Link href="#" className="text-gray-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
