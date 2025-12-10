'use server';

import { calculateUsageLimits, shouldResetGenerationCount, UsageLimits, UserSubscription } from '@/lib/subscription';
import { createClient } from '@/utils/supabase/server';

// Get user's subscription and usage data
export async function getUserSubscription(): Promise<UserSubscription | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_plan, generation_count, generation_reset_at')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // Return default free subscription if no profile
    return {
      status: 'free',
      plan: null,
      generationCount: 0,
      customDomainCount: 0,
      generationResetAt: null,
    };
  }

  // Count custom domains for this user
  const { count: domainCount } = await supabase
    .from('projects')
    .select('custom_domain', { count: 'exact' })
    .eq('user_id', user.id)
    .not('custom_domain', 'is', null);

  return {
    status: profile.subscription_status || 'free',
    plan: profile.subscription_plan,
    generationCount: profile.generation_count || 0,
    customDomainCount: domainCount || 0,
    generationResetAt: profile.generation_reset_at,
  };
}

// Get user's usage limits
export async function getUserLimits(): Promise<UsageLimits | null> {
  const subscription = await getUserSubscription();
  if (!subscription) return null;
  
  return calculateUsageLimits(subscription);
}

// Check if user can generate a new website
export async function canUserGenerate(): Promise<{ allowed: boolean; reason?: string; limits?: UsageLimits }> {
  const limits = await getUserLimits();
  
  if (!limits) {
    return { allowed: false, reason: 'Please log in to generate websites' };
  }
  
  if (!limits.canGenerate) {
    if (limits.planName === 'Free') {
      return { 
        allowed: false, 
        reason: `You've used all ${limits.generationsLimit} free generations. Upgrade to continue!`,
        limits 
      };
    }
    return { 
      allowed: false, 
      reason: `You've reached your monthly limit of ${limits.generationsLimit} generations. Limit resets next month.`,
      limits 
    };
  }
  
  return { allowed: true, limits };
}

// Check if user can add a custom domain
export async function canUserAddCustomDomain(): Promise<{ allowed: boolean; reason?: string; limits?: UsageLimits }> {
  const limits = await getUserLimits();
  
  if (!limits) {
    return { allowed: false, reason: 'Please log in to add custom domains' };
  }
  
  if (limits.planName === 'Free') {
    return { 
      allowed: false, 
      reason: 'Custom domains are not available on the Free plan. Upgrade to Starter or Pro!',
      limits 
    };
  }
  
  if (!limits.canAddCustomDomain) {
    return { 
      allowed: false, 
      reason: `You've reached your limit of ${limits.customDomainsLimit} custom domains. Upgrade to Pro for unlimited domains!`,
      limits 
    };
  }
  
  return { allowed: true, limits };
}

// Increment generation count after successful generation
export async function incrementGenerationCount(): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Get current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('generation_count, generation_reset_at')
    .eq('id', user.id)
    .single();

  let newCount = 1;
  let resetAt = new Date().toISOString();

  if (profile) {
    // Check if we need to reset the count (new month)
    if (shouldResetGenerationCount(profile.generation_reset_at)) {
      newCount = 1;
      resetAt = new Date().toISOString();
    } else {
      newCount = (profile.generation_count || 0) + 1;
      resetAt = profile.generation_reset_at || new Date().toISOString();
    }
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      generation_count: newCount,
      generation_reset_at: resetAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.error('Error incrementing generation count:', error);
    return false;
  }

  return true;
}

// Reset generation count (admin use or monthly reset)
export async function resetGenerationCount(): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('profiles')
    .update({
      generation_count: 0,
      generation_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  return !error;
}
