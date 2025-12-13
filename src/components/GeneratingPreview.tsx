'use client';

import { motion } from 'framer-motion';
import { Code, Sparkles } from 'lucide-react';

export const GeneratingPreview = () => {
    return (
        <div className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
            {/* Subtle grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]" />

            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />

            {/* Main content */}
            <div className="relative z-10 text-center px-8 max-w-md">
                {/* Simple animated icon */}
                <motion.div
                    className="relative w-20 h-20 mx-auto mb-8"
                    animate={{
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {/* Spinning outer ring */}
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

                    {/* Inner icon */}
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
                            <Code className="w-8 h-8 text-indigo-400" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Text */}
                <h3 className="text-xl font-semibold text-white mb-2">
                    Generating your website
                </h3>

                <p className="text-sm text-gray-500 mb-8">
                    AI is crafting your code...
                </p>

                {/* Animated progress dots */}
                <div className="flex items-center justify-center gap-1.5">
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

                {/* Subtle feature hints */}
                <div className="mt-12 flex items-center justify-center gap-6 text-xs text-gray-600">
                    <motion.div
                        className="flex items-center gap-2"
                        animate={{
                            opacity: [0.4, 0.7, 0.4],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: 0,
                        }}
                    >
                        <Code className="w-3 h-3" />
                        <span>Components</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-2"
                        animate={{
                            opacity: [0.4, 0.7, 0.4],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: 1,
                        }}
                    >
                        <Sparkles className="w-3 h-3" />
                        <span>Styling</span>
                    </motion.div>

                    <motion.div
                        className="flex items-center gap-2"
                        animate={{
                            opacity: [0.4, 0.7, 0.4],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: 2,
                        }}
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Optimizing</span>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
