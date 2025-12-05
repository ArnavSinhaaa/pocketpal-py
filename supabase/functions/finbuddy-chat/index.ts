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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch comprehensive user financial data
    const [expensesRes, goalsRes, statsRes, profileRes, investmentsRes, debtsRes, billsRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(50),
      supabase.from('financial_goals').select('*').eq('user_id', user.id),
      supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
      supabase.from('profiles').select('annual_salary, display_name').eq('user_id', user.id).single(),
      supabase.from('investments').select('*').eq('user_id', user.id),
      supabase.from('liabilities').select('*').eq('user_id', user.id),
      supabase.from('bill_reminders').select('*').eq('user_id', user.id).eq('is_paid', false),
    ]);

    const expenses = expensesRes.data || [];
    const goals = goalsRes.data || [];
    const stats = statsRes.data;
    const profile = profileRes.data;
    const investments = investmentsRes.data || [];
    const debts = debtsRes.data || [];
    const bills = billsRes.data || [];

    // Calculate detailed financial metrics
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const expensesByCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

    const totalInvestments = investments.reduce((sum, i) => sum + Number(i.current_value || i.purchase_price * i.quantity), 0);
    const totalDebt = debts.reduce((sum, d) => sum + Number(d.outstanding_amount), 0);
    const monthlyEMI = debts.reduce((sum, d) => sum + Number(d.emi_amount || 0), 0);
    const pendingBills = bills.reduce((sum, b) => sum + Number(b.amount), 0);

    // Get current month expenses
    const now = new Date();
    const currentMonthExpenses = expenses.filter(e => {
      const expDate = new Date(e.date);
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    });
    const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate savings rate
    const monthlySalary = (profile?.annual_salary || 0) / 12;
    const savingsRate = monthlySalary > 0 ? ((monthlySalary - currentMonthTotal) / monthlySalary * 100).toFixed(1) : 0;

    const userName = profile?.display_name || 'there';

    const contextMessage = `
=== USER FINANCIAL PROFILE (All amounts in Indian Rupees ₹) ===

BASIC INFO:
- Name: ${userName}
- Annual Salary: ₹${(profile?.annual_salary || 0).toLocaleString('en-IN')}
- Monthly Salary: ₹${monthlySalary.toLocaleString('en-IN')}

SPENDING ANALYSIS (Current Month):
- Current Month Spending: ₹${currentMonthTotal.toLocaleString('en-IN')}
- Estimated Savings Rate: ${savingsRate}%
- Total Expenses Tracked (Recent 50): ₹${totalExpenses.toLocaleString('en-IN')}

CATEGORY-WISE BREAKDOWN:
${Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  • ${k}: ₹${v.toLocaleString('en-IN')} (${(v/totalExpenses*100).toFixed(1)}%)`).join('\n') || '  No expenses recorded'}

TOP 5 RECENT EXPENSES:
${expenses.slice(0, 5).map(e => `  • ${e.category}: ₹${Number(e.amount).toLocaleString('en-IN')} on ${new Date(e.date).toLocaleDateString('en-IN')} - ${e.description || 'No description'}`).join('\n') || '  No recent expenses'}

FINANCIAL GOALS (${goals.length} active):
${goals.map(g => {
  const progress = (Number(g.current_amount) / Number(g.target_amount) * 100).toFixed(0);
  return `  • ${g.title}: ₹${Number(g.current_amount).toLocaleString('en-IN')}/₹${Number(g.target_amount).toLocaleString('en-IN')} (${progress}% complete)`;
}).join('\n') || '  No goals set'}

INVESTMENTS:
- Total Portfolio Value: ₹${totalInvestments.toLocaleString('en-IN')}
- Number of Investments: ${investments.length}
${investments.slice(0, 5).map(i => `  • ${i.name} (${i.investment_type}): ₹${Number(i.current_value || i.purchase_price * i.quantity).toLocaleString('en-IN')}`).join('\n') || ''}

LIABILITIES:
- Total Outstanding Debt: ₹${totalDebt.toLocaleString('en-IN')}
- Monthly EMI Burden: ₹${monthlyEMI.toLocaleString('en-IN')}
- EMI to Income Ratio: ${monthlySalary > 0 ? (monthlyEMI/monthlySalary*100).toFixed(1) : 0}%

PENDING BILLS:
- Total Pending: ₹${pendingBills.toLocaleString('en-IN')}
- Number of Bills: ${bills.length}

GAMIFICATION STATS:
- Current Streak: ${stats?.current_streak || 0} days
- Longest Streak: ${stats?.longest_streak || 0} days
- Total Points: ${stats?.total_points || 0}
- Goals Completed: ${stats?.goals_completed || 0}

=== END OF FINANCIAL DATA ===
`;

    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_KEY');
    if (!GOOGLE_AI_KEY) {
      console.error('No Google AI key found');
      throw new Error('GOOGLE_AI_KEY is not configured');
    }

    const systemPrompt = `You are FinBuddy, an expert AI-powered personal finance assistant specifically designed for Indian users. You combine the expertise of a Chartered Accountant, Financial Planner, and friendly advisor.

## YOUR CORE IDENTITY
- Name: FinBuddy
- Personality: Warm, encouraging, knowledgeable, and culturally aware
- Expertise: Indian taxation, investments, budgeting, debt management, and financial planning
- Communication Style: Clear, concise, actionable advice with occasional emojis for warmth

## YOUR CAPABILITIES
1. **Expense Analysis**: Identify spending patterns, suggest optimizations, detect unusual expenses
2. **Budget Planning**: Create realistic budgets following 50-30-20 or customized rules for Indian lifestyle
3. **Tax Optimization (FY 2025-26)**: 
   - Section 80C (₹1.5L limit): ELSS, PPF, EPF, NSC, Tax-saver FDs, Life Insurance, Tuition Fees
   - Section 80D: Health Insurance (₹25K self, ₹50K parents if senior)
   - Section 80CCD(1B): Additional ₹50K for NPS
   - HRA exemptions calculation
   - New vs Old tax regime comparison
4. **Investment Guidance**: 
   - Risk profiling and asset allocation
   - SIP recommendations for goals
   - ELSS vs PPF vs NPS comparison
   - Emergency fund planning (6-12 months expenses)
5. **Debt Management**:
   - Debt-to-income ratio analysis
   - Snowball vs Avalanche payoff strategies
   - Loan restructuring advice
6. **Goal Planning**: 
   - SMART goal setting
   - Required monthly savings calculation
   - Time-to-goal projections

## RESPONSE GUIDELINES
- Always use Indian Rupees (₹) with proper Indian numbering (lakhs: ₹1,00,000 and crores: ₹1,00,00,000)
- Reference current Indian tax slabs when relevant
- Suggest India-specific financial products (ELSS, PPF, NPS, ULIPs, etc.)
- Consider Indian lifestyle factors (festivals, weddings, family obligations)
- Provide specific numbers and calculations when possible
- Keep responses focused and under 200 words unless detailed analysis is requested
- Use bullet points for clarity
- End with a clear action item or follow-up question when appropriate

## CURRENT USER CONTEXT
${contextMessage}

## IMPORTANT
- Base ALL advice on the user's actual financial data provided above
- If data is missing, ask clarifying questions before giving generic advice
- Always consider the user's complete financial picture (income, expenses, goals, debts, investments)
- Celebrate their wins (streaks, goal progress, good savings rate)
- Be encouraging but honest about areas needing improvement`;

    // Build conversation for Gemini
    const geminiContents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GOOGLE_AI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiContents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits required. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI service error', details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stream the response back to the client
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
