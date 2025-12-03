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

    const { data: liabilities, error: liabilitiesError } = await supabase
      .from('liabilities')
      .select('*')
      .eq('user_id', user.id);

    if (liabilitiesError) {
      throw liabilitiesError;
    }

    const debts = liabilities || [];
    const totalDebt = debts.reduce((sum, d) => sum + Number(d.outstanding_amount), 0);
    const totalMonthlyPayment = debts.reduce((sum, d) => sum + Number(d.emi_amount || 0), 0);
    const weightedInterestRate = debts.length > 0 
      ? debts.reduce((sum, d) => sum + (Number(d.interest_rate) * Number(d.outstanding_amount)), 0) / totalDebt
      : 0;

    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_KEY');
    if (!GOOGLE_AI_KEY) {
      throw new Error('GOOGLE_AI_KEY is not configured');
    }

    const systemPrompt = `You are a CA-level debt management specialist. Analyze debt portfolios and create detailed payoff strategies.

Format your response as JSON:
{
  "snowballStrategy": {
    "payoffOrder": [{"debtType": "string", "lender": "string", "amount": number, "monthsToPayoff": number, "totalInterest": number}],
    "totalMonths": number,
    "totalInterest": number,
    "description": "string"
  },
  "avalancheStrategy": {
    "payoffOrder": [{"debtType": "string", "lender": "string", "amount": number, "monthsToPayoff": number, "totalInterest": number}],
    "totalMonths": number,
    "totalInterest": number,
    "description": "string"
  },
  "interestSavings": {
    "snowballVsMinimum": number,
    "avalancheVsMinimum": number,
    "avalancheVsSnowball": number
  },
  "acceleratedPayoff": [{"extraPaymentPercent": number, "extraMonthlyAmount": number, "newPayoffMonths": number, "interestSaved": number, "timeReduction": "string"}],
  "recommendations": {
    "immediate": ["string"],
    "strategy": ["string"],
    "longTerm": ["string"]
  },
  "milestones": [{"milestone": "string", "targetDate": "string", "amountPaid": number}],
  "summary": "string"
}`;

    const userPrompt = `Analyze my debt portfolio and create elimination strategies:

Debt Summary:
- Total Debt: ₹${totalDebt.toLocaleString('en-IN')}
- Total Monthly Payment: ₹${totalMonthlyPayment.toLocaleString('en-IN')}
- Weighted Interest Rate: ${weightedInterestRate.toFixed(2)}%

Individual Debts:
${debts.map(d => `
- ${d.liability_type} (${d.lender})
  Principal: ₹${Number(d.principal_amount).toLocaleString('en-IN')}
  Outstanding: ₹${Number(d.outstanding_amount).toLocaleString('en-IN')}
  Interest: ${Number(d.interest_rate)}%
  EMI: ₹${Number(d.emi_amount || 0).toLocaleString('en-IN')}
`).join('\n')}

Create debt snowball and avalanche strategies with:
1. Payment order for each strategy
2. Projected payoff timeline
3. Interest savings comparison
4. Accelerated payoff options (extra 10%, 20%, 30% payment)
5. Debt-free milestone timeline`;

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
          maxOutputTokens: 4096,
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
      throw new Error('AI service error');
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].trim();
    }
    
    const analysisData = JSON.parse(jsonContent);

    const enrichedData = {
      ...analysisData,
      actualValues: {
        totalDebt,
        totalMonthlyPayment,
        weightedInterestRate,
        debtCount: debts.length
      }
    };

    return new Response(JSON.stringify(enrichedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Debt analyzer error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
