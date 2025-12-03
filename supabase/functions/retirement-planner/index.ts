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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_AI_KEY')!;

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const [profileRes, expensesRes, investmentsRes, assetsRes, goalsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('expenses').select('*').eq('user_id', user.id),
      supabase.from('investments').select('*').eq('user_id', user.id),
      supabase.from('assets').select('*').eq('user_id', user.id),
      supabase.from('financial_goals').select('*').eq('user_id', user.id)
    ]);

    const profile = profileRes.data;
    const expenses = expensesRes.data || [];
    const investments = investmentsRes.data || [];
    const assets = assetsRes.data || [];
    const goals = goalsRes.data || [];

    const annualSalary = Number(profile?.annual_salary || 0);
    const monthlyExpenses = expenses
      .filter(e => {
        const expenseDate = new Date(e.date);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return expenseDate >= oneMonthAgo;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

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

    const enrichedAnalysis = {
      ...analysis,
      currentFinancials: {
        annualSalary,
        monthlyExpenses,
        currentSavings,
        monthlySavingCapacity: (annualSalary / 12) - monthlyExpenses
      }
    };

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
