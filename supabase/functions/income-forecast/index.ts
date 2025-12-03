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

    const [expensesRes, indirectIncomeRes, profileRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: true }),
      supabase.from('indirect_income_sources').select('*').eq('user_id', user.id),
      supabase.from('profiles').select('annual_salary').eq('user_id', user.id).single(),
    ]);

    const expenses = expensesRes.data || [];
    const indirectIncome = indirectIncomeRes.data || [];
    const profile = profileRes.data;

    const monthlyData: Record<string, { expenses: number; count: number }> = {};
    expenses.forEach(exp => {
      const monthKey = exp.date.substring(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { expenses: 0, count: 0 };
      }
      monthlyData[monthKey].expenses += Number(exp.amount);
      monthlyData[monthKey].count += 1;
    });

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

    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_KEY');
    if (!GOOGLE_AI_KEY) {
      throw new Error('GOOGLE_AI_KEY is not configured');
    }

    const systemPrompt = `You are a financial forecasting expert. Analyze historical data and provide accurate predictions.

Format your response as JSON:
{
  "forecast": {
    "month1": { "income": number, "expenses": number, "savings": number, "confidenceLow": number, "confidenceHigh": number },
    "month2": { "income": number, "expenses": number, "savings": number, "confidenceLow": number, "confidenceHigh": number },
    "month3": { "income": number, "expenses": number, "savings": number, "confidenceLow": number, "confidenceHigh": number }
  },
  "trend": "growth|decline|stable",
  "confidence": "high|medium|low",
  "summary": "Plain language summary of the forecast",
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"],
  "alerts": ["alert if any"]
}`;

    const userPrompt = `Analyze my financial data and forecast next ${timeframe} month(s):

Historical Monthly Expenses:
${historicalSummary}

Current Monthly Income: ₹${totalMonthlyIncome.toLocaleString('en-IN')}
- Salary: ₹${monthlySalary.toLocaleString('en-IN')}
- Side Income: ₹${monthlyIndirectIncome.toLocaleString('en-IN')}
${scenarioDescription}

Total months of data: ${Object.keys(monthlyData).length}

Provide a ${timeframe}-month forecast with confidence intervals and actionable recommendations.`;

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
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI service error', details: errorText }), {
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
