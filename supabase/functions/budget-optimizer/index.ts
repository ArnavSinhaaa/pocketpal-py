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

    // Fetch user's financial data
    const [expensesRes, goalsRes, profileRes, indirectIncomeRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(90),
      supabase.from('financial_goals').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('annual_salary').eq('user_id', user.id).single(),
      supabase.from('indirect_income_sources').select('*').eq('user_id', user.id),
    ]);

    const expenses = expensesRes.data || [];
    const goals = goalsRes.data || [];
    const profile = profileRes.data;
    const indirectIncome = indirectIncomeRes.data || [];

    // Calculate category-wise spending
    const categorySpending: Record<string, number> = {};
    
    // Use last 3 months for better averaging
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentExpenses = expenses.filter(exp => new Date(exp.date) >= threeMonthsAgo);
    
    console.log(`Found ${recentExpenses.length} expenses in last 3 months out of ${expenses.length} total`);

    recentExpenses.forEach(exp => {
      categorySpending[exp.category] = (categorySpending[exp.category] || 0) + Number(exp.amount);
    });

    // Calculate actual months span from expense data
    let monthsOfData = 1;
    if (recentExpenses.length > 0) {
      const expenseDates = recentExpenses.map(e => new Date(e.date).getTime());
      const earliestExpense = Math.min(...expenseDates);
      const latestExpense = Math.max(...expenseDates);
      const daySpan = (latestExpense - earliestExpense) / (24 * 60 * 60 * 1000);
      monthsOfData = Math.max(1, Math.ceil(daySpan / 30));
    }

    const monthlySpendingByCategory: Record<string, number> = {};
    Object.entries(categorySpending).forEach(([cat, total]) => {
      monthlySpendingByCategory[cat] = Math.round(total / monthsOfData);
    });

    const totalMonthlySpending = Object.values(monthlySpendingByCategory).reduce((sum, amt) => sum + amt, 0);
    
    console.log(`User data - Salary: ₹${profile?.annual_salary || 0}, Expenses: ${expenses.length}, Monthly spending: ₹${totalMonthlySpending}, Months span: ${monthsOfData}`);

    // Calculate monthly income
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

    // Calculate monthly goal contributions needed
    const goalContributions = goals.reduce((sum, goal) => {
      if (goal.target_date) {
        const remaining = Number(goal.target_amount) - Number(goal.current_amount);
        const monthsLeft = Math.max(1, Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
        return sum + (remaining / monthsLeft);
      }
      return sum;
    }, 0);

    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_KEY');
    if (!GOOGLE_AI_KEY) {
      throw new Error('GOOGLE_AI_KEY is not configured');
    }

    const systemPrompt = `You are an expert financial advisor specializing in budget optimization. Analyze spending patterns and create optimal budgets using the 50/30/20 rule as a guideline (50% needs, 30% wants, 20% savings/goals), but adjust based on user's specific situation.

Your task:
1. Analyze current spending by category
2. Identify overspending and optimization opportunities
3. Create an optimized budget that balances needs, wants, and savings
4. Ensure budget allocates enough for financial goals
5. Provide specific, actionable recommendations for each category

Format response as JSON:
{
  "optimizedBudget": {
    "categoryName": { "current": number, "recommended": number, "savings": number },
    ...
  },
  "totalSavingsPotential": number,
  "budgetBreakdown": {
    "needs": { "amount": number, "percentage": number },
    "wants": { "amount": number, "percentage": number },
    "savings": { "amount": number, "percentage": number }
  },
  "recommendations": ["detailed rec1", "detailed rec2", ...],
  "quickWins": ["easy win1", "easy win2", ...],
  "summary": "plain language summary of the optimized budget"
}`;

    const userPrompt = `Create an optimized budget for me:

Monthly Income: ₹${totalMonthlyIncome.toLocaleString('en-IN')}
Current Monthly Spending: ₹${totalMonthlySpending.toLocaleString('en-IN')}
Monthly Goal Contributions Needed: ₹${goalContributions.toLocaleString('en-IN')}

Category-wise Monthly Spending (averaged over 3 months):
${Object.entries(monthlySpendingByCategory)
  .map(([cat, amt]) => `- ${cat}: ₹${amt.toLocaleString('en-IN')} (${totalMonthlySpending > 0 ? ((amt/totalMonthlySpending)*100).toFixed(1) : 0}%)`)
  .join('\n') || '- No spending data available'}

Active Financial Goals: ${goals.length}

${totalMonthlySpending === 0 && totalMonthlyIncome > 0 ? 
  `Note: No expense data found. Please provide recommendations based on the 50/30/20 rule for an income of ₹${totalMonthlyIncome.toLocaleString('en-IN')}/month.` : 
  'Please create an optimized budget that helps me save more while maintaining a good quality of life. Prioritize my financial goals and identify quick wins.'}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt + '\n\n' + userPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
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
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].trim();
    }
    
    const budgetData = JSON.parse(jsonContent);

    return new Response(JSON.stringify(budgetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Budget optimizer error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
