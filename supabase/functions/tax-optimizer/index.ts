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

    const [profileRes, deductionsRes, expensesRes, investmentsRes, liabilitiesRes] = await Promise.all([
      supabase.from('profiles').select('annual_salary').eq('user_id', user.id).single(),
      supabase.from('tax_deductions').select('*').eq('user_id', user.id),
      supabase.from('expenses').select('*').eq('user_id', user.id),
      supabase.from('investments').select('*').eq('user_id', user.id),
      supabase.from('liabilities').select('*').eq('user_id', user.id),
    ]);

    const profile = profileRes.data;
    const deductions = deductionsRes.data || [];
    const expenses = expensesRes.data || [];
    const investments = investmentsRes.data || [];
    const liabilities = liabilitiesRes.data || [];

    const annualSalary = Number(profile?.annual_salary || 0);
    
    const deductionsByType: Record<string, number> = {};
    deductions.forEach(ded => {
      deductionsByType[ded.deduction_type] = (deductionsByType[ded.deduction_type] || 0) + Number(ded.amount);
    });

    const medicalExpenses = expenses.filter(e => e.category === 'Healthcare' || e.category === 'Medical').reduce((sum, e) => sum + Number(e.amount), 0);
    const educationExpenses = expenses.filter(e => e.category === 'Education').reduce((sum, e) => sum + Number(e.amount), 0);
    
    const homeLoanInterest = liabilities
      .filter(l => l.liability_type === 'home_loan')
      .reduce((sum, l) => {
        const monthlyInterest = (Number(l.outstanding_amount) * Number(l.interest_rate)) / (12 * 100);
        return sum + (monthlyInterest * 12);
      }, 0);

    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_KEY');
    if (!GOOGLE_AI_KEY) {
      throw new Error('GOOGLE_AI_KEY is not configured');
    }

    const systemPrompt = `You are a CA-level tax optimization expert for India.

Format response as JSON:
{
  "currentTaxLiability": number,
  "potentialSavings": number,
  "effectiveTaxRate": number,
  "recommendations": {
    "immediate": [{"action": "string", "savings": number, "effort": "low|medium|high"}],
    "shortTerm": [{"action": "string", "savings": number, "effort": "low|medium|high"}],
    "longTerm": [{"action": "string", "savings": number, "effort": "low|medium|high"}]
  },
  "deductionOpportunities": [
    {"section": "string", "description": "string", "limit": number, "utilized": number, "available": number, "howToClaim": "string"}
  ],
  "regimeComparison": {
    "oldRegime": {"tax": number, "pros": ["string"], "cons": ["string"]},
    "newRegime": {"tax": number, "pros": ["string"], "cons": ["string"]},
    "recommendation": "string"
  },
  "investmentSuggestions": [
    {"instrument": "string", "amount": number, "taxBenefit": number, "additionalBenefits": "string"}
  ],
  "quickWins": ["string"],
  "summary": "string"
}`;

    const userPrompt = `Provide comprehensive tax optimization analysis:

Income Details:
- Annual Salary: ₹${annualSalary.toLocaleString('en-IN')}

Current Deductions Claimed:
${Object.entries(deductionsByType).map(([type, amt]) => 
  `- ${type}: ₹${amt.toLocaleString('en-IN')}`
).join('\n')}

Potential Deductions Found:
- Medical Expenses (Annual): ₹${medicalExpenses.toLocaleString('en-IN')}
- Education Expenses (Annual): ₹${educationExpenses.toLocaleString('en-IN')}
- Home Loan Interest (Annual): ₹${homeLoanInterest.toLocaleString('en-IN')}

Investment Portfolio Value: ₹${investments.reduce((sum, inv) => sum + Number(inv.current_value || 0), 0).toLocaleString('en-IN')}

Liabilities: ${liabilities.length} loans/debts

Provide a CA-level tax optimization strategy with specific, actionable recommendations.`;

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
    
    const taxData = JSON.parse(jsonContent);

    return new Response(JSON.stringify(taxData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Tax optimizer error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
