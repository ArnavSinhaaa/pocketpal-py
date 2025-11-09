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
            content: 'You are a CA-level debt management specialist. Analyze debt portfolios and create detailed payoff strategies.'
          },
          {
            role: 'user',
            content: `Analyze my debt portfolio and create elimination strategies:

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
5. Debt-free milestone timeline`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_debt_strategy',
            description: 'Provide comprehensive debt elimination strategies',
            parameters: {
              type: 'object',
              properties: {
                snowballStrategy: {
                  type: 'object',
                  properties: {
                    payoffOrder: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          debtType: { type: 'string' },
                          lender: { type: 'string' },
                          amount: { type: 'number' },
                          monthsToPayoff: { type: 'number' },
                          totalInterest: { type: 'number' }
                        },
                        required: ['debtType', 'lender', 'amount', 'monthsToPayoff', 'totalInterest']
                      }
                    },
                    totalMonths: { type: 'number' },
                    totalInterest: { type: 'number' },
                    description: { type: 'string' }
                  },
                  required: ['payoffOrder', 'totalMonths', 'totalInterest', 'description']
                },
                avalancheStrategy: {
                  type: 'object',
                  properties: {
                    payoffOrder: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          debtType: { type: 'string' },
                          lender: { type: 'string' },
                          amount: { type: 'number' },
                          monthsToPayoff: { type: 'number' },
                          totalInterest: { type: 'number' }
                        },
                        required: ['debtType', 'lender', 'amount', 'monthsToPayoff', 'totalInterest']
                      }
                    },
                    totalMonths: { type: 'number' },
                    totalInterest: { type: 'number' },
                    description: { type: 'string' }
                  },
                  required: ['payoffOrder', 'totalMonths', 'totalInterest', 'description']
                },
                interestSavings: {
                  type: 'object',
                  properties: {
                    snowballVsMinimum: { type: 'number' },
                    avalancheVsMinimum: { type: 'number' },
                    avalancheVsSnowball: { type: 'number' }
                  },
                  required: ['snowballVsMinimum', 'avalancheVsMinimum', 'avalancheVsSnowball']
                },
                acceleratedPayoff: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      extraPaymentPercent: { type: 'number' },
                      extraMonthlyAmount: { type: 'number' },
                      newPayoffMonths: { type: 'number' },
                      interestSaved: { type: 'number' },
                      timeReduction: { type: 'string' }
                    },
                    required: ['extraPaymentPercent', 'extraMonthlyAmount', 'newPayoffMonths', 'interestSaved', 'timeReduction']
                  }
                },
                recommendations: {
                  type: 'object',
                  properties: {
                    immediate: { type: 'array', items: { type: 'string' } },
                    strategy: { type: 'array', items: { type: 'string' } },
                    longTerm: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['immediate', 'strategy', 'longTerm']
                },
                milestones: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      milestone: { type: 'string' },
                      targetDate: { type: 'string' },
                      amountPaid: { type: 'number' }
                    },
                    required: ['milestone', 'targetDate', 'amountPaid']
                  }
                },
                summary: { type: 'string' }
              },
              required: ['snowballStrategy', 'avalancheStrategy', 'interestSavings', 'acceleratedPayoff', 'recommendations', 'milestones', 'summary']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_debt_strategy' } }
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
      throw new Error('AI service error');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || !toolCall.function?.arguments) {
      console.error('No tool call in response:', JSON.stringify(data));
      throw new Error('AI did not return structured data');
    }
    
    const analysisData = JSON.parse(toolCall.function.arguments);

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
