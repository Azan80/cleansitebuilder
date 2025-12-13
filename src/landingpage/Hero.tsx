import { FadeIn } from "@/components/animations/FadeIn";
import { HeroDemo } from "@/landingpage/HeroDemo";
import { HeroPromptInput } from "@/landingpage/HeroPromptInput";
import { FaBootstrap, FaCss3Alt, FaHtml5 } from "react-icons/fa";
import { SiTailwindcss } from "react-icons/si";

export const Hero = () => {
   return (
      <section className="relative min-h-screen flex flex-col pt-32 pb-20 overflow-hidden bg-[#030712]">
         {/* Background Grid & Glow */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

         <div className="container mx-auto px-6 relative z-10">
            <div className="text-center max-w-4xl mx-auto mb-16">

               <FadeIn>
                  <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
                     Generate Website Templates <br />
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                        Faster & More Efficiently.
                     </span>
                  </h1>
               </FadeIn>

               <FadeIn delay={0.1}>
                  <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                     Experience the future of web development. Build production-ready websites with AI—faster and more efficiently than ever before.
                  </p>
               </FadeIn>

               <FadeIn delay={0.3}>
                  <HeroPromptInput />
               </FadeIn>

               <FadeIn delay={0.5}>
                  <div className="mt-16 flex flex-col items-center justify-center gap-4">
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
                  </div>
               </FadeIn>
            </div>

            {/* Interactive Demo Interface */}
            <HeroDemo />
         </div>
      </section>
   );
};
