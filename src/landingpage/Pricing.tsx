import { FadeIn } from "@/components/animations/FadeIn";
import { Check, Sparkles } from "lucide-react";

interface PricingProps {
  userEmail?: string | null;
}

export const Pricing = ({ userEmail }: PricingProps) => {
  const getCheckoutUrl = (productId: string) => {
    let url = `/api/checkout?products=${productId}`;
    if (userEmail) {
      url += `&customerEmail=${encodeURIComponent(userEmail)}`;
    }
    return url;
  };

  const plans = [
    {
      name: 'Starter',
      price: 10,
      description: 'Perfect for individuals and small projects',
      popular: true,
      productId: process.env.NEXT_PUBLIC_POLAR_STARTER_PRODUCT_ID || 'YOUR_STARTER_PRODUCT_ID',
      features: [
        { text: '250 premium credits/month', included: true },
        { text: 'Multi-page websites (up to 10 pages)', included: true },
        { text: 'Custom domain for 5 websites', included: true },
        { text: 'deepseek-reasoner DeepSeek-V3.2 with thinking mode', included: true },
        { text: 'One-click Netlify deployment', included: true },
        { text: 'Quick edit mode', included: true },
        { text: 'Export HTML/CSS files', included: true },
        { text: 'No branding', included: true },
        { text: 'Email support', included: true },
      ],
    },
    {
      name: 'Pro',
      price: 20,
      description: 'For power users and agencies',
      popular: false,
      productId: process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID || 'YOUR_PRO_PRODUCT_ID',
      features: [
        { text: '500 premium credits/month', included: true },
        { text: 'Unlimited pages per website', included: true },
        { text: 'Unlimited custom domains', included: true },
        { text: 'deepseek-reasoner DeepSeek-V3.2 with thinking mode', included: true },
        { text: 'One-click Netlify deployment', included: true },
        { text: 'Parallel generation (multiple at once)', included: true },
        { text: 'Priority AI processing', included: true },
        { text: 'Export & white-label', included: true },
        { text: 'Priority support', included: true },
        { text: 'No branding', included: true },
      ],
    },
  ];

  return (
    <section id="pricing" className="py-32 bg-[#030712] relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-white mb-6">Simple, transparent pricing.</h2>
          <p className="text-gray-400">Start building AI-powered websites today. No hidden fees, cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <FadeIn
              key={index}
              delay={index * 0.1}
              className={`relative p-8 rounded-3xl border transition-all duration-300 ${plan.popular
                ? "bg-white/5 border-purple-500/50 shadow-2xl shadow-purple-500/10"
                : "bg-transparent border-white/10 hover:border-white/20"
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold uppercase tracking-wide rounded-full flex items-center gap-1 shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-3 h-3" /> Best Value
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <p className="text-gray-400 text-sm mb-8">{plan.description}</p>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className={`flex items-start gap-3 text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Check className={`w-5 h-5 mt-0.5 shrink-0 ${feature.included ? (plan.popular ? "text-purple-400" : "text-blue-400") : "text-gray-700"}`} />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <a
                href={getCheckoutUrl(plan.productId)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${plan.popular
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/30"
                  : "bg-white/10 text-white hover:bg-white/20"
                  }`}
              >
                Get Started
              </a>
            </FadeIn>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400">
            🆓 Want to try first?{' '}
            <a href="/signup" className="text-purple-400 hover:text-purple-300 underline">
              Start with 5 free generations
            </a>
            {' '}— no credit card required.
          </p>
        </div>
      </div>
    </section>
  );
};
