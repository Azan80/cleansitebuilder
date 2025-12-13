'use client';

import { createClient } from '@/utils/supabase/client';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export const AutoCreateProjectHandler = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const autoCreate = searchParams.get('auto_create');
        const prompt = searchParams.get('prompt');

        if (autoCreate === 'true' && prompt && !isProcessing) {
            handleAutoCreate(prompt);
        }
    }, [searchParams, isProcessing]);

    const handleAutoCreate = async (prompt: string) => {
        setIsProcessing(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // User somehow got here without being logged in, redirect to signup
                router.push(`/signup?prompt=${encodeURIComponent(prompt)}`);
                return;
            }

            // Generate project name with AI
            const { generateProjectName } = await import('@/app/actions/project-name-generator');
            const projectName = await generateProjectName(prompt);

            // Create project
            const { data: project, error } = await supabase
                .from('projects')
                .insert({
                    user_id: user.id,
                    name: projectName,
                    description: prompt,
                })
                .select()
                .single();

            if (!error && project) {
                // Clean URL and redirect to builder
                router.push(`/builder/${project.id}`);
            } else {
                console.error('Error creating project:', error);
                router.push('/builder');
            }
        } catch (err) {
            console.error('Error in auto-create:', err);
            router.push('/builder');
        }
    };

    // Show fullscreen loading while processing
    if (isProcessing) {
        return (
            <div className="fixed inset-0 bg-[#030712] z-50 flex items-center justify-center">
                {/* Background effects */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 text-center">
                    {/* Animated icon */}
                    <motion.div
                        className="w-20 h-20 mx-auto mb-6 relative"
                        animate={{
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <motion.div
                            className="absolute inset-0 rounded-full border border-indigo-500/30"
                            animate={{
                                rotate: 360,
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full" />
                        </motion.div>

                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                animate={{
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Sparkles className="w-8 h-8 text-indigo-400" />
                            </motion.div>
                        </div>
                    </motion.div>

                    <h2 className="text-2xl font-bold text-white mb-2">Setting up your project</h2>
                    <p className="text-gray-400">Creating your workspace...</p>

                    {/* Animated dots */}
                    <div className="flex items-center justify-center gap-1.5 mt-6">
                        {[0, 1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full"
                                animate={{
                                    opacity: [0.2, 1, 0.2],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
