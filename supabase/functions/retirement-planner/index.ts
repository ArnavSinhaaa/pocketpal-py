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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_AI_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Fetching data for user:', user.id);

    const [profileRes, expensesRes, investmentsRes, assetsRes, goalsRes, indirectIncomeRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('expenses').select('*').eq('user_id', user.id),
      supabase.from('investments').select('*').eq('user_id', user.id),
      supabase.from('assets').select('*').eq('user_id', user.id),
      supabase.from('financial_goals').select('*').eq('user_id', user.id),
      supabase.from('indirect_income_sources').select('*').eq('user_id', user.id)
    ]);

    console.log('Profile:', profileRes.data, 'Error:', profileRes.error);
    console.log('Expenses count:', expensesRes.data?.length, 'Error:', expensesRes.error);

    const profile = profileRes.data;
    const expenses = expensesRes.data || [];
    const investments = investmentsRes.data || [];
    const assets = assetsRes.data || [];
    const goals = goalsRes.data || [];
    const indirectIncome = indirectIncomeRes.data || [];

    const annualSalary = Number(profile?.annual_salary || 0);
    
    // Calculate monthly expenses - use actual expense data or estimate from income
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentExpenses = expenses.filter(e => new Date(e.date) >= threeMonthsAgo);
    const totalRecentExpenses = recentExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    
    // Calculate monthly average based on actual expense data timespan
    let monthlyExpenses = 0;
    if (recentExpenses.length > 0) {
      // Find the earliest and latest expense dates
      const expenseDates = recentExpenses.map(e => new Date(e.date).getTime());
      const earliestExpense = Math.min(...expenseDates);
      const latestExpense = Math.max(...expenseDates);
      
      // Calculate months spanning the data (minimum 1 month)
      const daySpan = (latestExpense - earliestExpense) / (24 * 60 * 60 * 1000);
      const monthsSpan = Math.max(1, Math.ceil(daySpan / 30));
      
      monthlyExpenses = totalRecentExpenses / monthsSpan;
      console.log(`Expense span: ${daySpan.toFixed(0)} days (${monthsSpan} months), Total: ₹${totalRecentExpenses}, Monthly avg: ₹${monthlyExpenses.toFixed(0)}`);
    } else if (annualSalary > 0) {
      // Estimate monthly expenses as 60% of monthly income if no expense data
      monthlyExpenses = (annualSalary / 12) * 0.6;
      console.log(`No expenses found, estimating from salary: ₹${monthlyExpenses.toFixed(0)}/month`);
    }
    
    // Calculate monthly indirect income
    const monthlyIndirectIncome = indirectIncome.reduce((sum, src) => {
      const amount = Number(src.amount);
      switch (src.frequency) {
        case 'daily': return sum + (amount * 30);
        case 'weekly': return sum + (amount * 4);
        case 'monthly': return sum + amount;
        case 'quarterly': return sum + (amount / 3);
        case 'yearly': return sum + (amount / 12);
        default: return sum + amount;
      }
    }, 0);

    console.log('Calculated values - Salary:', annualSalary, 'Monthly Expenses:', monthlyExpenses, 'Indirect Income:', monthlyIndirectIncome);

    const totalInvestments = investments.reduce((sum, inv) => 
      sum + (Number(inv.current_value) || Number(inv.purchase_price) * Number(inv.quantity)), 0
    );
    
    const totalAssets = assets.reduce((sum, asset) => sum + Number(asset.current_value), 0);
    const currentSavings = totalInvestments + totalAssets;

    const retirementGoal = goals.find(g => 
      g.category?.toLowerCase().includes('retirement') || 
      g.title.toLowerCase().includes('retirement')
    );

    const systemPrompt = `You are a Chartered Accountant specializing in retirement planning. Provide comprehensive analysis.

Format response as JSON:
{
  "sipProjections": [
    {"monthlyInvestment": number, "expectedReturn": number, "years": number, "futureValue": number, "totalInvested": number, "returns": number}
  ],
  "retirementTargets": [
    {"retirementAge": number, "yearsToRetirement": number, "requiredCorpus": number, "monthlyExpenseAtRetirement": number, "monthlyInvestmentNeeded": number}
  ],
  "withdrawalStrategies": [
    {"strategyName": "string", "swpRate": number, "monthlyIncome": number, "corpusRequired": number, "yearsCovered": number, "description": "string"}
  ],
  "inflationAnalysis": {
    "currentMonthlyExpense": number,
    "inflationRate": number,
    "projections": [{"year": number, "monthlyExpense": number, "annualExpense": number}]
  },
  "recommendations": {
    "immediate": ["string"],
    "midTerm": ["string"],
    "longTerm": ["string"]
  },
  "summary": "string"
}`;

    const userPrompt = `Create a comprehensive retirement plan for:

Current Financial Position:
- Annual Salary: ₹${annualSalary.toLocaleString('en-IN')}
- Monthly Expenses: ₹${monthlyExpenses.toLocaleString('en-IN')}
- Current Savings/Investments: ₹${currentSavings.toLocaleString('en-IN')}
- Retirement Goal: ${retirementGoal ? `₹${Number(retirementGoal.target_amount).toLocaleString('en-IN')}` : 'Not Set'}

Calculate and provide:
1. SIP projections (monthly investments of ₹5k, ₹10k, ₹25k, ₹50k)
2. Retirement corpus target based on current expenses with inflation
3. Different retirement ages (55, 60, 65)
4. Withdrawal strategies (SWP rates)
5. Inflation-adjusted projections (6% inflation)

Provide specific, actionable recommendations.`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`, {
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
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Google AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].trim();
    }

    const analysis = JSON.parse(jsonContent);

    // Calculate total monthly income including indirect sources
    const totalMonthlyIncome = (annualSalary / 12) + monthlyIndirectIncome;
    const monthlySavingCapacity = totalMonthlyIncome - monthlyExpenses;

    const enrichedAnalysis = {
      ...analysis,
      currentFinancials: {
        annualSalary,
        monthlyExpenses,
        currentSavings,
        monthlyIndirectIncome,
        totalMonthlyIncome,
        monthlySavingCapacity: monthlySavingCapacity > 0 ? monthlySavingCapacity : 0
      }
    };

    console.log('Returning enriched analysis with financials:', enrichedAnalysis.currentFinancials);

    return new Response(JSON.stringify(enrichedAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Retirement planner error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
