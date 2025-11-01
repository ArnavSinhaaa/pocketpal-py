import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's financial data
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

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
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

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI service requires payment. Please contact support.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('FinBuddy chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
