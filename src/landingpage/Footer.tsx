

import { Github, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="bg-[#030712] border-t border-white/5 pt-24 pb-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <Image src="/icon/project-initiation (1).png" alt="Logo" width={40} height={40} className="w-10 h-10" />
              <span className="text-xl font-bold text-white">CleanSiteBuilder</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              The AI-powered frontend engineer for modern teams.
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <span className="text-gray-500">Need help?</span>
              <a href="mailto:support@cleansitebuilder.com" className="text-white hover:text-indigo-400 transition-colors font-medium">
                support@cleansitebuilder.com
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Product</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li><Link href="#features" className="hover:text-indigo-400 transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-indigo-400 transition-colors">Pricing</Link></li>
              <li><Link href="/tools" className="hover:text-indigo-400 transition-colors">Free Tools</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Free Tools</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li><Link href="/tools/seo-analyzer" className="hover:text-indigo-400 transition-colors">SEO Analyzer</Link></li>
              <li><Link href="/tools/meta-tag-generator" className="hover:text-indigo-400 transition-colors">Meta Tag Generator</Link></li>
              <li><Link href="/tools/base64" className="hover:text-indigo-400 transition-colors">Base64 Encoder</Link></li>
              <li><Link href="/tools/qr-code-generator" className="hover:text-indigo-400 transition-colors">QR Code Generator</Link></li>
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
            © {new Date().getFullYear()} CleanSiteBuilder Inc. All rights reserved.
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
