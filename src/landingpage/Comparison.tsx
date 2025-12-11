import { FadeIn } from "@/components/animations/FadeIn";
import { ProgressBar } from "@/components/animations/ProgressBar";
import { AlertTriangle, Check, X, Zap } from "lucide-react";
import Image from "next/image";

export const Comparison = () => {
    return (
        <section className="py-32 bg-[#030712] relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <FadeIn
                        className="inline-block mb-4"
                    >
                        <span className="px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium">
                            Value Comparison
                        </span>
                    </FadeIn>
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        Stop overpaying for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">limited credits.</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Get 2.5x more credits for less than half the price.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">

                    {/* Competitor Card (Lovable) */}
                    <FadeIn
                        direction="left"
                        className="relative p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all duration-500"
                    >
                        <div className="absolute -top-4 left-8 px-4 py-1 bg-gray-800 text-gray-400 text-xs font-bold uppercase tracking-wider rounded-full border border-gray-700">
                            Competitor
                        </div>

                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700 overflow-hidden">
                                    <Image
                                        src="/logos/lovable.ico"
                                        alt="Competitor Logo"
                                        width={24}
                                        height={24}
                                        className="blur-[2px] opacity-50"
                                    />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-300">Others</h3>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">$25</span>
                                <span className="text-gray-500">/mo</span>
                            </div>
                            <p className="text-red-400 text-sm mt-2 font-mono flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" /> $0.25 per credit
                            </p>
                        </div>

                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-gray-400">
                                <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold">100</span>
                                </div>
                                <span>Credits per month</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-500 line-through">
                                <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center shrink-0">
                                    <X className="w-3 h-3" />
                                </div>
                                <span>DeepSeek-V3.2 Reasoning</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-500 line-through">
                                <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center shrink-0">
                                    <X className="w-3 h-3" />
                                </div>
                                <span>Unlimited Custom Domains</span>
                            </li>
                        </ul>
                    </FadeIn>

                    {/* CleanSiteBuilder Card */}
                    <FadeIn
                        direction="right"
                        className="relative p-10 rounded-3xl border border-purple-500/50 bg-[#0a0a0a] shadow-[0_0_50px_rgba(168,85,247,0.15)] scale-105 z-10"
                    >
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold uppercase tracking-wider rounded-full shadow-lg shadow-purple-500/40 flex items-center gap-2">
                            <Zap className="w-4 h-4 fill-white" /> Best Value
                        </div>

                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 relative">
                                    <Image
                                        src="/icon/project-initiation (1).png"
                                        alt="CleanSiteBuilder Logo"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <h3 className="text-3xl font-bold text-white">CleanSiteBuilder</h3>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-200">
                                    $10
                                </span>
                                <span className="text-gray-400 font-medium">/mo</span>
                            </div>
                            <p className="text-emerald-400 text-sm mt-2 font-mono flex items-center gap-2">
                                <Check className="w-3 h-3" /> Only $0.04 per credit
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-purple-200 font-medium">Monthly Credits</span>
                                    <span className="text-white font-bold text-lg">250</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                    <ProgressBar />
                                </div>
                                <div className="mt-2 text-xs text-purple-300/60 text-right">
                                    2.5x more than competitor
                                </div>
                            </div>

                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-white">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <span>DeepSeek-V3.2 Thinking Mode</span>
                                </li>
                                <li className="flex items-center gap-3 text-white">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <span>Unlimited Custom Domains</span>
                                </li>
                            </ul>
                        </div>
                    </FadeIn>

                </div>
            </div>
        </section>
    );
};
