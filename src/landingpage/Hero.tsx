"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Cpu, Globe, Layout, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { FaBootstrap, FaCss3Alt, FaHtml5 } from "react-icons/fa";
import { SiTailwindcss } from "react-icons/si";

export const Hero = () => {
   const [step, setStep] = useState(0); // 0: typing, 1: generating, 2: complete
   const [scenarioIndex, setScenarioIndex] = useState(0);
   const [text, setText] = useState("");

   const SCENARIOS = [
      {
         id: "analytics",
         prompt: "A futuristic analytics dashboard with holographic data visualization, neon gradients, and glassmorphism..."
      },
      {
         id: "project",
         prompt: "A high-performance project management interface with deep space theme, glowing status indicators, and real-time sync..."
      },
      {
         id: "docs",
         prompt: "A cyberpunk-inspired developer documentation portal with terminal-style code blocks and neon syntax highlighting..."
      }
   ];

   const currentScenario = SCENARIOS[scenarioIndex];

   useEffect(() => {
      if (step === 0) {
         let i = 0;
         setText("");
         const interval = setInterval(() => {
            setText(currentScenario.prompt.slice(0, i));
            i++;
            if (i > currentScenario.prompt.length) {
               clearInterval(interval);
               setTimeout(() => setStep(1), 500);
            }
         }, 30);
         return () => clearInterval(interval);
      } else if (step === 1) {
         const timer = setTimeout(() => {
            setStep(2);
         }, 2000);
         return () => clearTimeout(timer);
      } else if (step === 2) {
         const timer = setTimeout(() => {
            setStep(0);
            setScenarioIndex((prev) => (prev + 1) % SCENARIOS.length);
         }, 5000);
         return () => clearTimeout(timer);
      }
   }, [step, scenarioIndex]);

   return (
      <section className="relative min-h-screen flex flex-col pt-32 pb-20 overflow-hidden bg-[#030712]">
         {/* Background Grid & Glow */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

         <div className="container mx-auto px-6 relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-16">


               <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight"
               >
                  Generate Website Templates <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                     Faster & More Efficiently.
                  </span>
               </motion.h1>

               <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
               >
                  Experience the future of web development. Build production-ready websites with AI—faster and more efficiently than ever before.
               </motion.p>

               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
               >
                  <button className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2">
                     Start Building <ArrowRight className="w-4 h-4" />
                  </button>
                  <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all">
                     View Showcase
                  </button>
               </motion.div>

               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="mt-16 flex flex-col items-center justify-center gap-4"
               >
                  <p className="text-sm text-gray-400 font-medium tracking-wide">Powered by modern tech stack</p>
                  <div className="relative group flex gap-8 items-center justify-center mt-4">
                     <div className="absolute -inset-4 bg-white/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                     <div className="relative z-10 group/icon">
                        <FaBootstrap className="w-12 h-12 md:w-16 md:h-16 text-[#7952B3] drop-shadow-[0_0_15px_rgba(121,82,179,0.3)] transition-transform group-hover/icon:scale-110" />
                     </div>

                     <div className="relative z-10 group/icon">
                        <FaHtml5 className="w-12 h-12 md:w-16 md:h-16 text-[#E34F26] drop-shadow-[0_0_15px_rgba(227,79,38,0.3)] transition-transform group-hover/icon:scale-110" />
                     </div>

                     <div className="relative z-10 group/icon">
                        <FaCss3Alt className="w-12 h-12 md:w-16 md:h-16 text-[#1572B6] drop-shadow-[0_0_15px_rgba(21,114,182,0.3)] transition-transform group-hover/icon:scale-110" />
                     </div>

                     <div className="relative z-10 group/icon">
                        <SiTailwindcss className="w-12 h-12 md:w-16 md:h-16 text-[#06B6D4] drop-shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-transform group-hover/icon:scale-110" />
                     </div>
                  </div>
               </motion.div>
            </div>

            {/* Interactive Demo Interface */}
            <motion.div
               initial={{ opacity: 0, y: 40 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               className="max-w-5xl mx-auto relative"
            >
               <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden ring-1 ring-white/5">
                  {/* Browser Chrome */}
                  <div className="h-12 bg-[#111] border-b border-white/5 flex items-center px-4 justify-between">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20" />
                     </div>
                     <div className="bg-[#000] px-4 py-1.5 rounded-md text-xs text-gray-500 font-mono flex items-center gap-2 border border-white/5 min-w-[200px] justify-center">
                        <Globe className="w-3 h-3" />
                        {step === 2 ? "cleansitebuilder.com/demo-project" : "cleansitebuilder.com/new-project"}
                     </div>
                     <div className="w-16 flex justify-end">
                        {step === 2 && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                     </div>
                  </div>

                  {/* Main Interface */}
                  <div className="p-0 min-h-[500px] flex flex-col relative bg-[#0a0a0a]">
                     <AnimatePresence mode="wait">
                        {step === 0 && (
                           <motion.div
                              key="input"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 flex items-center justify-center p-8"
                           >
                              {/* Background Grid inside container */}
                              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px]" />

                              <div className="w-full max-w-2xl relative z-10">
                                 <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-30 blur-lg animate-pulse" />
                                    <div className="relative bg-[#1a1a1a] border border-white/10 rounded-xl p-6 shadow-2xl">
                                       <div className="flex items-start gap-4">
                                          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                                             <Sparkles className="w-4 h-4 text-indigo-400" />
                                          </div>
                                          <div className="flex-1">
                                             <div className="font-mono text-gray-400 text-xs mb-2 uppercase tracking-wider">AI Prompt</div>
                                             <div className="text-white text-lg font-medium min-h-[3rem] leading-relaxed">
                                                {text}<span className="animate-pulse text-indigo-400">|</span>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </motion.div>
                        )}

                        {step === 1 && (
                           <motion.div
                              key="generating"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 flex flex-col md:flex-row bg-[#030712]"
                           >
                              {/* Code Panel */}
                              <div className="w-full md:w-1/3 border-r border-white/10 bg-[#050505] p-6 font-mono text-xs text-gray-400 overflow-hidden relative">
                                 <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-loading-bar shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                 <div className="space-y-2 relative z-10">
                                    <div className="text-emerald-400 flex gap-2"><span className="text-gray-600">01</span> {">"} Initializing neural network...</div>
                                    <div className="text-emerald-400 flex gap-2"><span className="text-gray-600">02</span> {">"} Synthesizing UI patterns...</div>
                                    <div className="text-cyan-400 flex gap-2"><span className="text-gray-600">03</span> {">"} Generating components:</div>
                                    <div className="pl-8 text-gray-500 border-l border-white/10 ml-1">
                                       <div className="text-cyan-200/70">→ Navbar.tsx <span className="text-emerald-500 text-[10px] ml-2">[DONE]</span></div>
                                       <div className="text-cyan-200/70">→ Hero.tsx <span className="text-emerald-500 text-[10px] ml-2">[DONE]</span></div>
                                       <div className="text-cyan-200/70">→ Dashboard.tsx <span className="text-yellow-500 text-[10px] ml-2">[BUILDING...]</span></div>
                                    </div>
                                    <div className="text-violet-400 flex gap-2"><span className="text-gray-600">04</span> {">"} Applying glassmorphism shaders...</div>
                                    <div className="text-pink-400 animate-pulse flex gap-2"><span className="text-gray-600">05</span> {">"} Compiling production bundle...</div>
                                 </div>
                                 {/* Matrix rain effect overlay (simplified) */}
                                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />
                              </div>

                              {/* Preview Panel */}
                              <div className="w-full md:w-2/3 bg-[#030712] flex flex-col items-center justify-center relative overflow-hidden">
                                 {/* Grid Background */}
                                 <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

                                 {/* Scanning Laser Effect */}
                                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent h-[200%] w-full animate-scan pointer-events-none" />

                                 <div className="w-3/4 space-y-4 relative z-10">
                                    {/* Wireframe Elements */}
                                    <div className="h-8 bg-white/5 rounded w-1/3 mx-auto border border-white/10 relative overflow-hidden">
                                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                                    </div>
                                    <div className="h-48 bg-white/5 rounded-xl w-full border border-white/10 relative overflow-hidden backdrop-blur-sm">
                                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ animationDelay: '0.2s' }} />
                                       <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                                       </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                       {[1, 2, 3].map((i) => (
                                          <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden">
                                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ animationDelay: `${0.2 + (i * 0.1)}s` }} />
                                          </div>
                                       ))}
                                    </div>
                                 </div>

                                 <div className="absolute bottom-12 flex items-center justify-center">
                                    <div className="bg-[#000]/80 backdrop-blur-md px-6 py-3 rounded-full border border-indigo-500/30 flex items-center gap-3 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                                       <Cpu className="w-4 h-4 text-indigo-400 animate-spin" />
                                       <span className="text-indigo-100 font-medium text-sm tracking-wide">AI Generating UI...</span>
                                    </div>
                                 </div>
                              </div>
                           </motion.div>
                        )}

                        {step === 2 && (
                           <motion.div
                              key="complete"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-[#030712] overflow-hidden font-sans flex"
                           >
                              {/* Analytics Dashboard Scenario */}
                              {currentScenario.id === "analytics" && (
                                 <div className="w-full h-full flex bg-[#030712] text-white relative overflow-hidden">
                                    {/* Ambient Background Glows */}
                                    <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
                                    <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />

                                    {/* Sidebar */}
                                    <div className="w-16 md:w-64 border-r border-white/5 bg-white/5 backdrop-blur-xl flex flex-col p-4 relative z-10">
                                       <div className="flex items-center gap-3 mb-8 px-2">
                                          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                                             <Layout className="w-5 h-5 text-white" />
                                          </div>
                                          <span className="font-bold text-lg hidden md:block tracking-tight">Nexus<span className="text-violet-400">AI</span></span>
                                       </div>
                                       <div className="space-y-1">
                                          {['Overview', 'Analytics', 'Customers', 'Products', 'Settings'].map((item, i) => (
                                             <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 ${i === 0 ? 'bg-white/10 text-white border border-white/10 shadow-inner' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                                                <div className={`w-5 h-5 rounded opacity-80 ${i === 0 ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-gray-700'}`} />
                                                <span className="hidden md:block text-sm font-medium">{item}</span>
                                             </div>
                                          ))}
                                       </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 p-6 md:p-8 overflow-y-auto relative z-10">
                                       <div className="flex justify-between items-center mb-8">
                                          <div>
                                             <h2 className="text-2xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Dashboard</h2>
                                             <p className="text-gray-500 text-sm">Real-time performance metrics.</p>
                                          </div>
                                          <div className="flex gap-3">
                                             <div className="px-3 py-1.5 bg-white/5 rounded-lg text-sm text-gray-300 border border-white/10 backdrop-blur-md">Last 7 Days</div>
                                             <div className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-sm font-medium shadow-lg shadow-violet-500/20">Export Report</div>
                                          </div>
                                       </div>

                                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                          {[
                                             { label: "Total Revenue", val: "$124,500.00", change: "+12.5%", trend: "up", grad: "from-violet-500/10 to-fuchsia-500/10", border: "border-violet-500/20" },
                                             { label: "Active Users", val: "45,231", change: "+8.2%", trend: "up", grad: "from-cyan-500/10 to-blue-500/10", border: "border-cyan-500/20" },
                                             { label: "Bounce Rate", val: "24.5%", change: "-2.1%", trend: "down", grad: "from-emerald-500/10 to-teal-500/10", border: "border-emerald-500/20" }
                                          ].map((stat, i) => (
                                             <div key={i} className={`bg-gradient-to-br ${stat.grad} p-6 rounded-2xl border ${stat.border} relative overflow-hidden group backdrop-blur-md`}>
                                                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
                                                   <div className="w-16 h-16 rounded-full bg-white/10 blur-xl" />
                                                </div>
                                                <div className="text-gray-400 text-sm font-medium mb-2 uppercase tracking-wider text-[10px]">{stat.label}</div>
                                                <div className="text-3xl font-bold mb-2 text-white">{stat.val}</div>
                                                <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' || stat.label === 'Bounce Rate' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                   <span>{stat.change}</span>
                                                   <span className="text-gray-500">vs last period</span>
                                                </div>
                                             </div>
                                          ))}
                                       </div>

                                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-64">
                                          <div className="md:col-span-2 bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col backdrop-blur-md relative overflow-hidden">
                                             <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
                                             <div className="flex justify-between items-center mb-6 relative z-10">
                                                <h3 className="font-semibold text-white">Revenue Trend</h3>
                                                <div className="flex gap-2">
                                                   <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                                                   <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                                                </div>
                                             </div>
                                             <div className="flex-1 flex items-end gap-4 px-2 relative z-10">
                                                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 65, 85].map((h, i) => (
                                                   <div key={i} className="flex-1 flex gap-1 h-full items-end group">
                                                      <div className="w-full bg-violet-500/10 rounded-t-sm relative overflow-hidden h-full">
                                                         <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-violet-500 to-violet-400 transition-all duration-500 rounded-t-sm group-hover:opacity-80 shadow-[0_0_15px_rgba(139,92,246,0.3)]" style={{ height: `${h}%` }} />
                                                      </div>
                                                      <div className="w-full bg-cyan-500/10 rounded-t-sm relative overflow-hidden h-full">
                                                         <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-cyan-500 to-cyan-400 transition-all duration-500 rounded-t-sm group-hover:opacity-80 shadow-[0_0_15px_rgba(6,182,212,0.3)]" style={{ height: `${h * 0.6}%` }} />
                                                      </div>
                                                   </div>
                                                ))}
                                             </div>
                                          </div>
                                          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col backdrop-blur-md relative overflow-hidden">
                                             <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                                             <h3 className="font-semibold mb-6 text-white relative z-10">Traffic Sources</h3>
                                             <div className="space-y-6 flex-1 relative z-10">
                                                {[
                                                   { label: "Direct", val: "45%", color: "bg-violet-500", shadow: "shadow-[0_0_10px_rgba(139,92,246,0.4)]" },
                                                   { label: "Social", val: "32%", color: "bg-cyan-500", shadow: "shadow-[0_0_10px_rgba(6,182,212,0.4)]" },
                                                   { label: "Organic", val: "23%", color: "bg-emerald-500", shadow: "shadow-[0_0_10px_rgba(16,185,129,0.4)]" }
                                                ].map((item, i) => (
                                                   <div key={i}>
                                                      <div className="flex justify-between text-sm mb-2">
                                                         <span className="text-gray-400">{item.label}</span>
                                                         <span className="font-medium text-white">{item.val}</span>
                                                      </div>
                                                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                         <div className={`h-full ${item.color} ${item.shadow} rounded-full`} style={{ width: item.val }} />
                                                      </div>
                                                   </div>
                                                ))}
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              )}

                              {/* Project Management Scenario */}
                              {currentScenario.id === "project" && (
                                 <div className="w-full h-full bg-[#050505] text-slate-50 flex relative">
                                    {/* Ambient Glow */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />

                                    {/* Sidebar */}
                                    <div className="w-16 md:w-64 border-r border-white/10 bg-[#0a0a0a] flex flex-col">
                                       <div className="h-16 flex items-center px-6 border-b border-white/10">
                                          <div className="flex items-center gap-2">
                                             <div className="w-6 h-6 bg-pink-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-[0_0_10px_rgba(219,39,119,0.4)]">P</div>
                                             <span className="font-bold text-white hidden md:block tracking-tight">PlanIt<span className="text-pink-500">.io</span></span>
                                          </div>
                                       </div>
                                       <div className="p-4 space-y-1">
                                          {['Dashboard', 'My Tasks', 'Inbox', 'Goals'].map((item, i) => (
                                             <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${i === 1 ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
                                                <div className="w-4 h-4 rounded bg-current opacity-20" />
                                                <span className="hidden md:block text-sm font-medium">{item}</span>
                                             </div>
                                          ))}
                                          <div className="pt-4 mt-4 border-t border-white/10">
                                             <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-2 hidden md:block">Projects</div>
                                             {['Website Redesign', 'Mobile App', 'Marketing Q4'].map((item, i) => (
                                                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                                                   <div className={`w-2 h-2 rounded-full ${['bg-pink-500', 'bg-purple-500', 'bg-indigo-500'][i]} shadow-[0_0_8px_rgba(255,255,255,0.3)]`} />
                                                   <span className="hidden md:block text-sm">{item}</span>
                                                </div>
                                             ))}
                                          </div>
                                       </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
                                       <div className="h-16 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0">
                                          <div className="flex items-center gap-4">
                                             <h2 className="font-bold text-lg text-white">Website Redesign</h2>
                                             <div className="flex gap-1">
                                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">On Track</span>
                                             </div>
                                          </div>
                                          <div className="flex items-center gap-4">
                                             <div className="flex -space-x-2">
                                                {[1, 2, 3, 4].map(i => (
                                                   <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-[#0a0a0a]" />
                                                ))}
                                                <div className="w-8 h-8 rounded-full bg-pink-500/20 border-2 border-[#0a0a0a] flex items-center justify-center text-xs text-pink-400 font-bold">+3</div>
                                             </div>
                                             <button className="bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-500 transition-all shadow-[0_0_15px_rgba(219,39,119,0.3)]">New Task</button>
                                          </div>
                                       </div>

                                       <div className="flex-1 overflow-x-auto p-6 bg-[#050505] relative">
                                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(219,39,119,0.05),transparent_50%)] pointer-events-none" />
                                          <div className="flex gap-6 h-full min-w-max relative z-10">
                                             {["To Do", "In Progress", "Review", "Done"].map((col, i) => (
                                                <div key={i} className="w-72 flex flex-col h-full">
                                                   <div className="flex justify-between items-center mb-4 px-1">
                                                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{col}</span>
                                                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 font-medium border border-white/5">3</span>
                                                   </div>
                                                   <div className="space-y-3 overflow-y-auto pr-2 pb-2">
                                                      {[1, 2, 3].map((card) => (
                                                         <div key={card} className="bg-[#111] p-4 rounded-xl border border-white/5 hover:border-pink-500/30 transition-all cursor-pointer group shadow-lg hover:shadow-pink-500/5 hover:-translate-y-1">
                                                            <div className="flex gap-2 mb-3">
                                                               <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${i === 0 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                                  {i === 0 ? 'High Priority' : 'Design'}
                                                               </span>
                                                            </div>
                                                            <div className="text-sm font-medium mb-3 text-gray-200 leading-snug group-hover:text-white transition-colors">
                                                               {i === 0 ? 'Update hero section copy and imagery' : 'Implement responsive navigation menu'}
                                                            </div>
                                                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                                               <div className="flex items-center gap-2 text-gray-500 text-xs">
                                                                  <div className="w-4 h-4 rounded-full bg-gray-800" />
                                                                  <span>Oct 24</span>
                                                               </div>
                                                               <div className="w-6 h-6 rounded-full bg-gray-800 border border-[#111]" />
                                                            </div>
                                                         </div>
                                                      ))}
                                                   </div>
                                                </div>
                                             ))}
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              )}

                              {/* Developer Docs Scenario */}
                              {currentScenario.id === "docs" && (
                                 <div className="w-full h-full bg-[#050505] text-gray-300 flex font-mono text-sm overflow-hidden relative">
                                    {/* Matrix/Cyberpunk Background */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff0005_1px,transparent_1px),linear-gradient(to_bottom,#00ff0005_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                                    {/* Sidebar */}
                                    <div className="w-64 border-r border-white/10 bg-[#0a0a0a] flex flex-col hidden md:flex relative z-10">
                                       <div className="h-14 flex items-center px-6 border-b border-white/10">
                                          <span className="font-bold text-green-400 tracking-tight flex items-center gap-2">
                                             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                             API Reference
                                          </span>
                                       </div>
                                       <div className="flex-1 overflow-y-auto p-4">
                                          <div className="mb-6">
                                             <div className="text-[10px] font-bold text-green-500/50 uppercase tracking-widest mb-3 px-2">Getting Started</div>
                                             <div className="space-y-1">
                                                {["Introduction", "Authentication", "Errors", "Pagination"].map((item, i) => (
                                                   <div key={i} className={`px-2 py-1.5 rounded cursor-pointer transition-all duration-300 ${i === 1 ? 'bg-green-500/10 text-green-400 border-l-2 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'hover:text-white hover:bg-white/5'}`}>
                                                      {item}
                                                   </div>
                                                ))}
                                             </div>
                                          </div>
                                          <div>
                                             <div className="text-[10px] font-bold text-green-500/50 uppercase tracking-widest mb-3 px-2">Resources</div>
                                             <div className="space-y-1">
                                                {["Customers", "Invoices", "Subscriptions", "Payment Methods"].map((item, i) => (
                                                   <div key={i} className="px-2 py-1.5 rounded cursor-pointer hover:text-white hover:bg-white/5 transition-colors">
                                                      {item}
                                                   </div>
                                                ))}
                                             </div>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
                                       <div className="h-14 border-b border-white/10 flex items-center justify-between px-8 bg-[#050505]/80 backdrop-blur shrink-0">
                                          <div className="flex items-center gap-2 text-xs text-gray-500">
                                             <span className="hover:text-green-400 cursor-pointer transition-colors">Docs</span>
                                             <span>/</span>
                                             <span className="hover:text-green-400 cursor-pointer transition-colors">API</span>
                                             <span>/</span>
                                             <span className="text-white">Authentication</span>
                                          </div>
                                          <div className="flex items-center gap-4">
                                             <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-bold tracking-wider">v2.0.1</div>
                                          </div>
                                       </div>

                                       <div className="flex-1 overflow-y-auto p-8">
                                          <div className="max-w-3xl mx-auto">
                                             <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Authentication</h1>
                                             <p className="text-gray-400 mb-8 leading-relaxed">
                                                The CleanSiteBuilder API uses API keys to authenticate requests. You can view and manage your API keys in the Dashboard.
                                             </p>

                                             <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 mb-8 flex gap-3 shadow-[0_0_20px_rgba(34,197,94,0.05)]">
                                                <div className="mt-1 text-green-400">ℹ️</div>
                                                <div className="text-sm text-green-200/80">
                                                   Your API keys carry many privileges, so be sure to keep them secure! Do not share your secret API keys in publicly accessible areas.
                                                </div>
                                             </div>

                                             <h3 className="text-xl font-semibold text-white mb-4">Authorization Header</h3>
                                             <p className="text-gray-400 mb-4 text-sm">
                                                Authentication to the API is performed via HTTP Basic Auth. Provide your API key as the basic auth username value.
                                             </p>

                                             <div className="bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden shadow-2xl mb-8 group hover:border-green-500/30 transition-colors">
                                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0f0f0f]">
                                                   <div className="flex gap-4 text-xs font-medium">
                                                      <span className="text-green-400 border-b-2 border-green-500 pb-3 -mb-3.5">cURL</span>
                                                      <span className="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">Node.js</span>
                                                      <span className="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">Python</span>
                                                   </div>
                                                   <div className="flex gap-1.5">
                                                      <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                                                      <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                                                   </div>
                                                </div>
                                                <div className="p-6 overflow-x-auto bg-[#050505] relative">
                                                   <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                                                   <pre className="text-sm font-mono leading-relaxed relative z-10">
                                                      <span className="text-purple-400">curl</span> <span className="text-gray-500">https://api.cleansitebuilder.com/v1/customers \</span><br />
                                                      <span className="text-gray-500">  -u </span> <span className="text-green-400">sk_test_123456789abcdef:</span> <span className="text-gray-500">\</span><br />
                                                      <span className="text-gray-500">  -d </span> <span className="text-blue-400">limit</span><span className="text-gray-500">=</span><span className="text-orange-400">3</span>
                                                   </pre>
                                                </div>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              )}
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               </div>
            </motion.div>
         </div>
      </section>
   );
};
