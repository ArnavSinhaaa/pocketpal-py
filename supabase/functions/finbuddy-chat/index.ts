/**
 * ========================================
 * FINBUDDY CHAT - AI Financial Assistant Edge Function
 * ========================================
 * 
 * This Supabase Edge Function powers the FinBuddy chat interface.
 * It fetches user financial data and uses AI to provide personalized advice.
 * 
 * KEY FEATURES:
 * - Real-time streaming responses
 * - Context-aware (uses user's actual financial data)
 * - Indian financial planning focused
 * - Tax slab explanation capability
 * 
 * TECH STACK:
 * - Deno runtime (serverless)
 * - Lovable AI Gateway (Gemini 2.5 Flash)
 * - Supabase client for data fetching
 * 
 * CODING TIP: Edge functions are perfect for:
 * - API integrations with secrets
 * - Complex business logic
 * - AI/LLM interactions
 * Keep client-side code simple, put heavy logic here!
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Required for fetch in Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

/**
 * CORS Headers - Required for browser requests
 * 
 * CODING TIP: Always set CORS headers for edge functions called from web apps!
 * Without these, browsers will block the requests.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Main request handler
 * 
 * FLOW:
 * 1. Handle CORS preflight
 * 2. Authenticate user
 * 3. Fetch user's financial data
 * 4. Build context for AI
 * 5. Call AI Gateway (streaming)
 * 6. Return stream to client
 */
serve(async (req) => {
  /**
   * Handle CORS Preflight Requests
   * 
   * CODING TIP: Browsers send OPTIONS requests before actual requests.
   * Always handle these first!
   */
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { messages } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    // Validate authentication
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    /**
     * Initialize Supabase client with user's auth token
     * 
     * CODING TIP: Pass the Authorization header to ensure all queries
     * respect Row Level Security (RLS) policies.
     */
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    /**
     * Fetch all user's financial data in parallel
     * 
     * CODING TIP: Use Promise.all() to fetch multiple things simultaneously!
     * This is much faster than sequential fetches.
     * 
     * WHAT WE FETCH:
     * - Recent expenses (last 20)
     * - Financial goals
     * - User stats (streak, achievements)
     * - Profile (salary information)
     */
    const [expensesRes, goalsRes, statsRes, profileRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(20),
      supabase.from('financial_goals').select('*').eq('user_id', user.id),
      supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
      supabase.from('profiles').select('annual_salary').eq('user_id', user.id).single(),
    ]);

    // Build context from user data
    const expenses = expensesRes.data || [];
    const goals = goalsRes.data || [];
    const stats = statsRes.data;
    const profile = profileRes.data;

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const expensesByCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

    const contextMessage = `
User's Financial Data (All amounts in Indian Rupees):
- Annual Salary: ₹${profile?.annual_salary?.toLocaleString('en-IN') || 0}
- Total Expenses (last 20): ₹${totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
- Expenses by Category: ${Object.entries(expensesByCategory).map(([k, v]) => `${k}: ₹${v.toLocaleString('en-IN')}`).join(', ')}
- Active Goals: ${goals.length}
- Goals Progress: ${goals.map(g => `${g.title}: ₹${Number(g.current_amount).toLocaleString('en-IN')}/₹${Number(g.target_amount).toLocaleString('en-IN')}`).join(', ')}
- Current Streak: ${stats?.current_streak || 0} days
- Total Expenses Tracked: ${stats?.expenses_count || 0}
- Goals Completed: ${stats?.goals_completed || 0}
- Total Points: ${stats?.total_points || 0}

Recent Expenses:
${expenses.slice(0, 5).map(e => `- ${e.category}: ₹${Number(e.amount).toLocaleString('en-IN')} (${e.description || 'No description'})`).join('\n')}

Indian Financial Context:
- Financial Year: April to March
- Tax slabs under new vs old regime
- Common tax-saving instruments: 80C (₹1.5L limit), 80D (health insurance), NPS (additional ₹50K)
- Popular investment options: ELSS, PPF, EPF, NPS, Mutual Funds, Fixed Deposits
`;

    /**
     * Get Lovable AI API Key
     * 
     * CODING TIP: Always validate environment variables early!
     * This prevents cryptic errors later.
     * 
     * EDIT NOTE: LOVABLE_API_KEY is auto-configured by Lovable.
     * You don't need to set it manually.
     */
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    /**
     * Call Lovable AI Gateway with streaming enabled
     * 
     * MODEL: google/gemini-2.5-flash
     * - Fast responses
     * - Good balance of quality and speed
     * - Cost-effective for chat
     * 
     * EDIT THIS to change AI model:
     * - google/gemini-2.5-pro (higher quality, slower)
     * - google/gemini-2.5-flash-lite (fastest, lower quality)
     */
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            /**
             * SYSTEM PROMPT - This is the AI's "personality" and knowledge base
             * 
             * EDIT THIS to change FinBuddy's behavior, expertise, or tone.
             * Keep it specific and actionable!
             */
            content: `You are FinBuddy, a friendly and supportive personal finance assistant specialized in Indian financial planning. You help users track expenses, manage budgets, save taxes, and achieve their financial goals in the Indian context.

Your personality:
- Warm, encouraging, and positive
- Give specific, actionable advice relevant to India
- Celebrate progress and milestones
- Use emojis occasionally to be friendly (but not excessively)
- Keep responses concise and focused
- Be empathetic when discussing financial challenges

Your capabilities:
- Analyze spending patterns and suggest improvements
- Help create and track budgets suitable for Indian lifestyle
- Provide goal-setting strategies
- Offer tax-saving tips (Section 80C, 80D, NPS, HRA, etc.)
- Suggest Indian investment options (ELSS, PPF, EPF, NPS, Mutual Funds, FDs)
- Give tips for saving money in Indian context
- Celebrate achievements and streaks
- Provide step-by-step guidance
- **EXPLAIN TAX SLABS IN PLAIN LANGUAGE** - Break down exactly how each slab impacts their income

India-Specific Tax Saving Knowledge:
- **Section 80C** (₹1.5 lakh limit): ELSS, PPF, EPF, Life Insurance, NSC, Tax-saving FDs, Home Loan Principal
- **Section 80D**: Health insurance premiums (₹25K for self, ₹50K if senior citizen, ₹25K for parents)
- **Section 80CCD(1B)**: Additional ₹50K for NPS contribution
- **Section 24**: Home loan interest deduction (₹2 lakh)
- **HRA**: House Rent Allowance exemption (if applicable)
- **Standard Deduction**: ₹50,000 for salaried individuals
- **New Tax Regime vs Old**: Explain trade-offs based on deductions
- **Financial Year**: April to March (Tax filing by July 31)

**TAX SLAB EXPLANATION CAPABILITY:**
When users ask about taxes, explain in simple terms:
1. How much they earn (total income)
2. What falls in which tax slab (0%, 5%, 10%, 15%, 20%, 30%)
3. Exactly how much tax they pay in each slab
4. Use examples: "Your first ₹3 lakhs are tax-free, then ₹3-7 lakhs is taxed at 5% (₹20,000 tax), etc."
5. Show the progressive nature: "You don't pay 30% on everything, only on income above ₹15 lakhs"
6. Calculate final effective tax rate
7. Suggest deductions that could lower their slab

Investment Suggestions:
- ELSS: Best for tax saving with 3-year lock-in
- PPF: Safe, 15-year tenure, tax-free returns
- EPF: Employer contribution, retirement corpus
- NPS: Additional tax benefit, retirement focused
- Mutual Funds: SIP for wealth creation
- Fixed Deposits: Safe, guaranteed returns

When responding:
- Always use Indian Rupees (₹) for amounts
- Format large numbers with Indian numbering (lakhs, crores)
- Reference specific data from the user's financial information
- Provide concrete examples and actionable steps
- Acknowledge their progress and achievements
- Be honest but supportive about areas for improvement
- Ask clarifying questions when needed
- Consider Indian festivals, expenses, and lifestyle patterns
- **When discussing taxes, break down slabs step-by-step with real numbers**

${contextMessage}`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    /**
     * Error Handling for AI Gateway
     * 
     * IMPORTANT: Always handle these specific status codes:
     * - 429: Rate limit (too many requests)
     * - 402: Payment required (out of credits)
     * - 500: Service error
     */
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      // Rate limiting
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Out of credits
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI service requires payment. Please contact support.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Other errors
      return new Response(JSON.stringify({ 
        error: 'AI service error', 
        details: errorText,
        status: response.status 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    /**
     * Return streaming response to client
     * 
     * CODING TIP: text/event-stream enables real-time token streaming.
     * The client receives text as it's generated, not all at once!
     */
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    /**
     * Global error handler
     * 
     * CODING TIP: Always log errors for debugging!
     * Check edge function logs when things go wrong.
     */
    console.error('FinBuddy chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * ========================================
 * DEBUGGING TIPS
 * ========================================
 * 
 * 1. Check Logs: View edge function logs in Supabase dashboard
 * 2. Test Locally: Use Supabase CLI to test functions locally
 * 3. Monitor Credits: Check AI usage in Lovable settings
 * 4. Rate Limits: Add delays if hitting rate limits
 * 
 * COMMON ISSUES:
 * - "No authorization header": Client not sending auth token
 * - 429 errors: Too many requests, add rate limiting
 * - 402 errors: Out of AI credits, top up in Lovable
 * - Slow responses: Consider caching or using lite model
 */
