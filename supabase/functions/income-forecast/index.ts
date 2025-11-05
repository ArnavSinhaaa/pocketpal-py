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

    const { timeframe = 3, whatIfScenario } = await req.json();

    // Fetch historical data
    const [expensesRes, indirectIncomeRes, profileRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: true }),
      supabase.from('indirect_income_sources').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('annual_salary').eq('user_id', user.id).single(),
    ]);

    const expenses = expensesRes.data || [];
    const indirectIncome = indirectIncomeRes.data || [];
    const profile = profileRes.data;

    // Group expenses by month
    const monthlyData: Record<string, { expenses: number; count: number }> = {};
    expenses.forEach(exp => {
      const monthKey = exp.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { expenses: 0, count: 0 };
      }
      monthlyData[monthKey].expenses += Number(exp.amount);
      monthlyData[monthKey].count += 1;
    });

    // Calculate total indirect income per month
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
    let totalMonthlyIncome = monthlySalary + monthlyIndirectIncome;

    // Apply what-if scenario if provided
    let scenarioDescription = '';
    if (whatIfScenario) {
      if (whatIfScenario.additionalIncome) {
        totalMonthlyIncome += Number(whatIfScenario.additionalIncome);
        scenarioDescription = `\n\nWhat-If Scenario: Adding ₹${Number(whatIfScenario.additionalIncome).toLocaleString('en-IN')} monthly income`;
      }
      if (whatIfScenario.incomeGrowthPercent) {
        const growth = Number(whatIfScenario.incomeGrowthPercent) / 100;
        totalMonthlyIncome = totalMonthlyIncome * (1 + growth);
        scenarioDescription += `\n${scenarioDescription ? 'and ' : 'What-If Scenario: '}${whatIfScenario.incomeGrowthPercent}% income growth`;
      }
    }

    const historicalSummary = Object.entries(monthlyData)
      .map(([month, data]) => `${month}: ₹${data.expenses.toLocaleString('en-IN')} (${data.count} expenses)`)
      .join('\n');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
 
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
            content: `You are a financial forecasting expert specializing in income prediction using regression analysis. Analyze historical data and provide accurate predictions.

Your task:
1. Analyze the user's historical expense patterns and income data
2. Use regression analysis to identify trends
3. Predict next ${timeframe} month(s)' income and expenses with confidence intervals
4. Provide confidence levels (high/medium/low) and trend analysis (growth/decline/stable)
5. Suggest actionable strategies to increase income or optimize expenses
6. Detect any anomalies or concerning patterns

Format your response as JSON with this structure:
{
  "forecast": {
    ${timeframe >= 1 ? '"month1": { "income": number, "expenses": number, "savings": number, "confidenceLow": number, "confidenceHigh": number },' : ''}
    ${timeframe >= 2 ? '"month2": { "income": number, "expenses": number, "savings": number, "confidenceLow": number, "confidenceHigh": number },' : ''}
    ${timeframe >= 3 ? '"month3": { "income": number, "expenses": number, "savings": number, "confidenceLow": number, "confidenceHigh": number },' : ''}
    ${timeframe >= 4 ? '"month4": { "income": number, "expenses": number, "savings": number, "confidenceLow": number, "confidenceHigh": number },' : ''}
    ${timeframe >= 5 ? '"month5": { "income": number, "expenses": number, "savings": number, "confidenceLow": number, "confidenceHigh": number },' : ''}
    ${timeframe >= 6 ? '"month6": { "income": number, "expenses": number, "savings": number, "confidenceLow": number, "confidenceHigh": number }' : ''}
  },
  "trend": "growth|decline|stable",
  "confidence": "high|medium|low",
  "summary": "Plain language summary of the forecast",
  "insights": ["insight1", "insight2", ...],
  "recommendations": ["actionable rec1", "actionable rec2", ...],
  "alerts": ["alert1 if any concerning patterns detected"]
}`
          },
          {
            role: 'user',
            content: `Analyze my financial data and forecast next ${timeframe} month(s):

Historical Monthly Expenses:
${historicalSummary}

Current Monthly Income: ₹${totalMonthlyIncome.toLocaleString('en-IN')}
- Salary: ₹${monthlySalary.toLocaleString('en-IN')}
- Side Income: ₹${monthlyIndirectIncome.toLocaleString('en-IN')}
${scenarioDescription}

Total months of data: ${Object.keys(monthlyData).length}

Please provide a ${timeframe}-month forecast using regression on the expense trends. Include confidence intervals (±10-20% based on data volatility), identify the overall trend (growth/decline/stable), detect any anomalies, and provide actionable recommendations to optimize finances.`
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
    
    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].trim();
    }
    
    const forecast = JSON.parse(jsonContent);

    return new Response(JSON.stringify(forecast), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Income forecast error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
