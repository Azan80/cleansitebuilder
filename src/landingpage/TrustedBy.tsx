import Image from 'next/image';

export const TrustedBy = () => {
    return (
        <section className="py-10 border-y border-white/5 bg-[#030712]/50 backdrop-blur-sm">
            <div className="container mx-auto px-6">
                <p className="text-center text-sm font-medium text-gray-500 mb-8 uppercase tracking-wider">
                    Trusted by industry leaders
                </p>
                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">

                    {/* DeepSeek */}
                    <div className="flex items-center gap-3 group">
                        <div className="relative w-8 h-8">
                            <Image
                                src="/logos/deepseek.ico"
                                alt="DeepSeek"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="text-xl font-bold text-white group-hover:text-blue-500 transition-colors">DeepSeek</span>
                    </div>

                    {/* Vercel */}
                    <div className="flex items-center gap-3 group">
                        <div className="relative w-8 h-8">
                            <Image
                                src="/logos/vercel.png"
                                alt="Vercel"
                                fill
                                className="object-contain invert"
                            />
                        </div>
                        <span className="text-xl font-bold text-white">Vercel</span>
                    </div>

                    {/* Netlify */}
                    <div className="flex items-center gap-3 group">
                        <div className="relative w-12 h-12">
                            <Image
                                src="/logos/netlify.png"
                                alt="Netlify"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="text-xl font-bold text-white group-hover:text-[#00C7B7] transition-colors">Netlify</span>
                    </div>

                </div>
            </div>
        </section>
    );
};
