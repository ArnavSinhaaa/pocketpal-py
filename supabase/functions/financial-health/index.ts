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

    // Fetch all user financial data
    const [expensesRes, goalsRes, profileRes, indirectIncomeRes, billsRes, userStatsRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('financial_goals').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('annual_salary').eq('user_id', user.id).single(),
      supabase.from('indirect_income_sources').select('*').eq('user_id', user.id),
      supabase.from('bill_reminders').select('*').eq('user_id', user.id),
      supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
    ]);

    const expenses = expensesRes.data || [];
    const goals = goalsRes.data || [];
    const profile = profileRes.data;
    const indirectIncome = indirectIncomeRes.data || [];
    const bills = billsRes.data || [];
    const userStats = userStatsRes.data;

    // Calculate financial metrics
    const last30DaysExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return expDate >= thirtyDaysAgo;
    });

    const monthlyExpenses = last30DaysExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    const monthlyIndirectIncome = indirectIncome.reduce((sum, src) => {
      const amount = Number(src.amount);
      switch (src.frequency) {
        case 'daily': return sum + (amount * 30);
        case 'weekly': return sum + (amount * 4);
        case 'monthly': return sum + amount;
        case 'quarterly': return sum + (amount / 3);
        case 'yearly': return sum + (amount / 12);
        default: return sum;
      }
    }, 0);

    const monthlySalary = profile?.annual_salary ? Number(profile.annual_salary) / 12 : 0;
    const totalMonthlyIncome = monthlySalary + monthlyIndirectIncome;
    const savingsRate = totalMonthlyIncome > 0 ? ((totalMonthlyIncome - monthlyExpenses) / totalMonthlyIncome) * 100 : 0;

    const unpaidBills = bills.filter(bill => !bill.is_paid).length;
    const activeGoals = goals.length;
    const completedGoals = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length;

    // Try LOVABLE_API_KEY first, fallback to LOVABLE_API_KEY_1
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY') || Deno.env.get('LOVABLE_API_KEY_1');
    if (!LOVABLE_API_KEY) {
      throw new Error('No Lovable API key configured');
    }
    
    console.log('Using Lovable API key to call AI gateway...');
 
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
            content: `You are a comprehensive financial health analyst. Calculate a detailed financial health score (0-100) based on multiple factors:
- Savings Rate (30 points): >20% excellent, 10-20% good, <10% poor
- Expense Management (25 points): Spending vs income ratio
- Financial Goals Progress (20 points): Active goals and completion rate
- Financial Consistency (15 points): Regular tracking and bill payment
- Emergency Fund Status (10 points): Months of expenses covered

Format response as JSON:
{
  "overallScore": number (0-100),
  "scoreBreakdown": {
    "savingsRate": { "score": number, "maxScore": 30, "status": "excellent|good|poor" },
    "expenseManagement": { "score": number, "maxScore": 25, "status": "excellent|good|poor" },
    "goalsProgress": { "score": number, "maxScore": 20, "status": "excellent|good|poor" },
    "consistency": { "score": number, "maxScore": 15, "status": "excellent|good|poor" },
    "emergencyFund": { "score": number, "maxScore": 10, "status": "excellent|good|poor" }
  },
  "healthLevel": "excellent|good|fair|poor",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "topPriorities": ["priority1", "priority2", "priority3"],
  "actionPlan": {
    "immediate": ["action1", "action2"],
    "shortTerm": ["action1", "action2"],
    "longTerm": ["action1", "action2"]
  },
  "summary": "personalized summary of financial health"
}`
          },
          {
            role: 'user',
            content: `Analyze my complete financial health:

Income & Expenses:
- Monthly Income: ₹${totalMonthlyIncome.toLocaleString('en-IN')}
- Monthly Expenses: ₹${monthlyExpenses.toLocaleString('en-IN')}
- Savings Rate: ${savingsRate.toFixed(1)}%

Financial Goals:
- Active Goals: ${activeGoals}
- Completed Goals: ${completedGoals}
- Goal Completion Rate: ${activeGoals > 0 ? ((completedGoals/activeGoals)*100).toFixed(1) : 0}%

Financial Consistency:
- Expense Tracking Streak: ${userStats?.current_streak || 0} days
- Total Expenses Tracked: ${userStats?.expenses_count || 0}
- Unpaid Bills: ${unpaidBills}

Total Expenses in Database: ${expenses.length}

Provide a comprehensive financial health assessment with a score out of 100 and actionable improvement plan.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ 
        error: 'AI service error', 
        details: errorText,
        status: response.status 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].trim();
    }
    
    const healthData = JSON.parse(jsonContent);

    return new Response(JSON.stringify(healthData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Financial health error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
