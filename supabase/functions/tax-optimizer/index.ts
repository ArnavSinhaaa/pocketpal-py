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
    
    // Calculate claimed deductions by type
    const deductionsByType: Record<string, number> = {};
    deductions.forEach(ded => {
      deductionsByType[ded.deduction_type] = (deductionsByType[ded.deduction_type] || 0) + Number(ded.amount);
    });

    // Check for potential deductions from expenses
    const medicalExpenses = expenses.filter(e => e.category === 'Healthcare' || e.category === 'Medical').reduce((sum, e) => sum + Number(e.amount), 0);
    const educationExpenses = expenses.filter(e => e.category === 'Education').reduce((sum, e) => sum + Number(e.amount), 0);
    
    // Home loan interest from liabilities
    const homeLoanInterest = liabilities
      .filter(l => l.liability_type === 'home_loan')
      .reduce((sum, l) => {
        const monthlyInterest = (Number(l.outstanding_amount) * Number(l.interest_rate)) / (12 * 100);
        return sum + (monthlyInterest * 12);
      }, 0);

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
            content: `You are a CA-level tax optimization expert for India. Analyze tax situations and provide comprehensive tax-saving strategies covering:
- Section 80C (₹1.5L limit): PPF, ELSS, EPF, Life Insurance, Home Loan Principal
- Section 80D: Health Insurance premiums
- Section 80CCD(1B): Additional NPS deduction (₹50K)
- Section 24: Home Loan Interest (₹2L limit)
- HRA exemption calculations
- Standard deduction (₹50K for salaried)
- Tax regime comparison (Old vs New)
- Investment strategies for tax efficiency

Format response as JSON:
{
  "currentTaxLiability": number,
  "potentialSavings": number,
  "effectiveTaxRate": number,
  "recommendations": {
    "immediate": [{"action": "desc", "savings": number, "effort": "low|medium|high"}],
    "shortTerm": [{"action": "desc", "savings": number, "effort": "low|medium|high"}],
    "longTerm": [{"action": "desc", "savings": number, "effort": "low|medium|high"}]
  },
  "deductionOpportunities": [
    {
      "section": "80C|80D|etc",
      "description": "what it covers",
      "limit": number,
      "utilized": number,
      "available": number,
      "howToClaim": "specific steps"
    }
  ],
  "regimeComparison": {
    "oldRegime": {"tax": number, "pros": ["..."], "cons": ["..."]},
    "newRegime": {"tax": number, "pros": ["..."], "cons": ["..."]},
    "recommendation": "old|new with reasoning"
  },
  "investmentSuggestions": [
    {
      "instrument": "ELSS|PPF|NPS|etc",
      "amount": number,
      "taxBenefit": number,
      "additionalBenefits": "..."
    }
  ],
  "quickWins": ["easy action1", "easy action2"],
  "summary": "comprehensive tax optimization summary"
}`
          },
          {
            role: 'user',
            content: `Provide comprehensive tax optimization analysis:

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

Provide a CA-level tax optimization strategy with specific, actionable recommendations for maximizing tax savings under Indian tax laws.`
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