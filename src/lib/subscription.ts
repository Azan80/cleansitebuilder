// Subscription plans and their limits
export const PLAN_LIMITS = {
  free: {
    generationsPerMonth: 2,
    maxCustomDomains: 0,
    maxPagesPerSite: 3,
    parallelGeneration: false,
    priorityProcessing: false,
  },
  starter: {
    generationsPerMonth: 150,
    maxCustomDomains: 5,
    maxPagesPerSite: 10,
    parallelGeneration: false,
    priorityProcessing: false,
  },
  pro: {
    generationsPerMonth: 300,
    maxCustomDomains: Infinity, // Unlimited
    maxPagesPerSite: Infinity, // Unlimited
    parallelGeneration: true,
    priorityProcessing: true,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export interface UserSubscription {
  status: 'free' | 'active' | 'canceled' | 'expired';
  plan: string | null;
  generationCount: number;
  customDomainCount: number;
  generationResetAt: string | null;
}

export interface UsageLimits {
  canGenerate: boolean;
  canAddCustomDomain: boolean;
  generationsUsed: number;
  generationsLimit: number;
  generationsRemaining: number;
  customDomainsUsed: number;
  customDomainsLimit: number;
  customDomainsRemaining: number;
  planName: string;
  isActive: boolean;
}

// Get the plan type from subscription
export function getPlanType(subscription: UserSubscription): PlanType {
  if (subscription.status !== 'active' || !subscription.plan) {
    return 'free';
  }
  
  const planName = subscription.plan.toLowerCase();
  if (planName.includes('pro')) {
    return 'pro';
  }
  if (planName.includes('starter')) {
    return 'starter';
  }
  
  return 'free';
}

// Check if generation count should reset (monthly reset)
export function shouldResetGenerationCount(resetAt: string | null): boolean {
  if (!resetAt) return true;
  
  const resetDate = new Date(resetAt);
  const now = new Date();
  
  // Reset if we're in a new month
  return (
    now.getMonth() !== resetDate.getMonth() ||
    now.getFullYear() !== resetDate.getFullYear()
  );
}

// Calculate user's usage limits
export function calculateUsageLimits(subscription: UserSubscription): UsageLimits {
  const planType = getPlanType(subscription);
  const limits = PLAN_LIMITS[planType];
  
  // Check if we need to reset generation count
  let generationsUsed = subscription.generationCount;
  if (shouldResetGenerationCount(subscription.generationResetAt)) {
    generationsUsed = 0;
  }
  
  const generationsRemaining = Math.max(0, limits.generationsPerMonth - generationsUsed);
  const customDomainsRemaining = limits.maxCustomDomains === Infinity 
    ? Infinity 
    : Math.max(0, limits.maxCustomDomains - subscription.customDomainCount);
  
  return {
    canGenerate: generationsUsed < limits.generationsPerMonth,
    canAddCustomDomain: subscription.customDomainCount < limits.maxCustomDomains,
    generationsUsed,
    generationsLimit: limits.generationsPerMonth,
    generationsRemaining,
    customDomainsUsed: subscription.customDomainCount,
    customDomainsLimit: limits.maxCustomDomains,
    customDomainsRemaining,
    planName: planType.charAt(0).toUpperCase() + planType.slice(1),
    isActive: subscription.status === 'active',
  };
}

// Format limit display (handle Infinity)
export function formatLimit(limit: number): string {
  return limit === Infinity ? '∞' : limit.toString();
}
