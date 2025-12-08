'use client'

import { Footer } from '@/landingpage/Footer'
import { Navbar } from '@/landingpage/Navbar'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Crown, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const plans = [
    {
        name: 'Starter',
        price: 10,
        description: 'Perfect for individuals and small projects',
        icon: Zap,
        color: 'from-blue-500 to-cyan-500',
        shadowColor: 'shadow-blue-500/20',
        popular: false,
        // TODO: Replace with your actual Polar product ID from Polar dashboard
        productId: process.env.NEXT_PUBLIC_POLAR_STARTER_PRODUCT_ID || 'YOUR_STARTER_PRODUCT_ID',
        features: [
            { text: '100 website generations/month', included: true },
            { text: 'Multi-page websites (up to 10 pages)', included: true },
            { text: 'Custom domain for 5 websites', included: true },
            { text: 'One-click Netlify deployment', included: true },
            { text: 'Quick edit mode', included: true },
            { text: 'Export HTML/CSS files', included: true },
            { text: 'Email support', included: true },
            { text: 'Parallel generation', included: false },
            { text: 'Unlimited custom domains', included: false },
            { text: 'API access', included: false },
        ],
    },
    {
        name: 'Pro',
        price: 20,
        description: 'For power users and agencies',
        icon: Crown,
        color: 'from-purple-500 to-pink-500',
        shadowColor: 'shadow-purple-500/20',
        popular: true,
        // TODO: Replace with your actual Polar product ID from Polar dashboard
        productId: process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID || 'YOUR_PRO_PRODUCT_ID',
        features: [
            { text: '250 website generations/month', included: true },
            { text: 'Unlimited pages per website', included: true },
            { text: 'Unlimited custom domains', included: true },
            { text: 'One-click Netlify deployment', included: true },
            { text: 'Parallel generation (multiple at once)', included: true },
            { text: 'Priority AI processing', included: true },
            { text: 'Export & white-label', included: true },
            { text: 'API access for automation', included: true },
            { text: 'Priority support', included: true },
            { text: 'No branding', included: true },
        ],
    },
]

export default function PricingPage() {
    const [userEmail, setUserEmail] = useState<string | null>(null)

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.email) {
                setUserEmail(user.email)
            }
        }
        fetchUser()
    }, [])

    const getCheckoutUrl = (productId: string) => {
        let url = `/api/checkout?products=${productId}`
        if (userEmail) {
            url += `&customerEmail=${encodeURIComponent(userEmail)}`
        }
        return url
    }

    return (
        <div className="min-h-screen bg-[#030014] text-white overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
            </div>

            {/* Navigation */}
            <Navbar />

            {/* Header */}
            <div className="relative z-10 text-center pt-32 pb-12 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-6">
                        <Sparkles className="w-4 h-4" />
                        Simple, transparent pricing
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                        Choose Your Plan
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Start building AI-powered websites today. No hidden fees, cancel anytime.
                    </p>
                </motion.div>

            </div>

            {/* Pricing Cards */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
                <div className="grid md:grid-cols-2 gap-8">
                    {plans.map((plan, index) => {
                        const Icon = plan.icon
                        const price = plan.price

                        return (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                                className={`relative group`}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                        <span className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full shadow-lg shadow-purple-500/30">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div
                                    className={`relative h-full p-8 rounded-2xl border transition-all duration-300 ${plan.popular
                                        ? 'bg-white/[0.08] border-purple-500/30 shadow-2xl ' + plan.shadowColor
                                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {/* Glow Effect */}
                                    {plan.popular && (
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
                                    )}

                                    <div className="relative z-10">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">{plan.name}</h3>
                                                <p className="text-gray-400 text-sm">{plan.description}</p>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-bold">${price}</span>
                                                <span className="text-gray-400">/month</span>
                                            </div>
                                        </div>

                                        {/* CTA Button */}
                                        <Link
                                            href={getCheckoutUrl(plan.productId)}
                                            className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium transition-all mb-8 ${plan.popular
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white shadow-lg shadow-purple-500/30'
                                                : 'bg-white/10 hover:bg-white/20 text-white'
                                                }`}
                                        >
                                            Get Started
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>

                                        {/* Features */}
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, i) => (
                                                <li
                                                    key={i}
                                                    className={`flex items-start gap-3 ${feature.included ? 'text-gray-300' : 'text-gray-600'
                                                        }`}
                                                >
                                                    <Check
                                                        className={`w-5 h-5 mt-0.5 shrink-0 ${feature.included
                                                            ? plan.popular
                                                                ? 'text-purple-400'
                                                                : 'text-blue-400'
                                                            : 'text-gray-700'
                                                            }`}
                                                    />
                                                    <span className="text-sm">{feature.text}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Free Tier Note */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="mt-12 text-center"
                >
                    <p className="text-gray-400">
                        🆓 Want to try first?{' '}
                        <Link href="/signup" className="text-purple-400 hover:text-purple-300 underline">
                            Start with 5 free generations
                        </Link>
                        {' '}— no credit card required.
                    </p>
                </motion.div>

                {/* FAQ Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mt-24"
                >
                    <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                q: 'What counts as a generation?',
                                a: 'Each time you create a new website or regenerate an existing one, it counts as one generation. Quick edits (text replacements) are free.',
                            },
                            {
                                q: 'Can I upgrade or downgrade anytime?',
                                a: 'Yes! You can switch plans at any time. Upgrades are immediate, downgrades take effect at the next billing cycle.',
                            },
                            {
                                q: 'What happens when I hit my limit?',
                                a: "You'll be prompted to upgrade or wait until your limit resets next month. Your existing websites remain accessible.",
                            },
                            {
                                q: 'Do you offer refunds?',
                                a: 'Yes, we offer a 7-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.',
                            },
                        ].map((faq, i) => (
                            <div
                                key={i}
                                className="p-6 rounded-xl bg-white/[0.03] border border-white/10"
                            >
                                <h3 className="font-medium mb-2">{faq.q}</h3>
                                <p className="text-gray-400 text-sm">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    )
}
