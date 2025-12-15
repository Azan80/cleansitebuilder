'use client';

import { createClient } from "@/utils/supabase/client";
import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const HeroPromptInput = () => {
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Not logged in - redirect to signup/login
                router.push(`/signup?prompt=${encodeURIComponent(prompt.trim())}`);
                return;
            }

            // Generate a smart project name using AI
            const { generateProjectName } = await import('@/app/actions/project-name-generator');
            const projectName = await generateProjectName(prompt.trim());

            // Create a new project for the logged-in user
            const { data: project, error } = await supabase
                .from('projects')
                .insert({
                    user_id: user.id,
                    name: projectName,
                    description: prompt.trim(),
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating project:', error);
                // Fallback: just go to builder
                router.push('/builder');
                return;
            }

            // Redirect to the new builder page with the project ID
            router.push(`/builder/${project.id}`);
        } catch (error) {
            console.error('Error:', error);
            // Fallback: just go to builder
            router.push('/builder');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto px-4">
            <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-500" />

                {/* Input container - responsive layout */}
                <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 md:p-3 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 shadow-2xl">
                    {/* Icon - hidden on mobile, visible on md+ */}
                    <div className="hidden md:flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-500/10 shrink-0">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>

                    {/* Input field */}
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your dream website..."
                        className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-base md:text-lg px-3 md:px-3 py-3 md:py-4"
                        disabled={isLoading}
                    />

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={!prompt.trim() || isLoading}
                        className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 disabled:scale-100 disabled:shadow-none"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <span className="hidden sm:inline">Generating...</span>
                                <span className="sm:hidden">Loading...</span>
                            </>
                        ) : (
                            <>
                                <span className="hidden sm:inline">Generate</span>
                                <span className="sm:hidden">Start</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Quick suggestion chips */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                    "Portfolio website with animations",
                    "E-commerce landing page",
                    "SaaS product page",
                    "Blog with modern design"
                ].map((suggestion, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setPrompt(suggestion)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-xs text-gray-400 hover:text-white transition-all"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </form>
    );
};
