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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

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

    // Fetch user data
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

    // Calculate current financial position
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

    const prompt = `As a Chartered Accountant, create a comprehensive retirement plan for a client with:

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

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a Chartered Accountant specializing in retirement planning.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_retirement',
            description: 'Analyze retirement planning with SIP projections and withdrawal strategies',
            parameters: {
              type: 'object',
              properties: {
                sipProjections: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      monthlyInvestment: { type: 'number' },
                      expectedReturn: { type: 'number' },
                      years: { type: 'number' },
                      futureValue: { type: 'number' },
                      totalInvested: { type: 'number' },
                      returns: { type: 'number' }
                    },
                    required: ['monthlyInvestment', 'expectedReturn', 'years', 'futureValue', 'totalInvested', 'returns']
                  }
                },
                retirementTargets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      retirementAge: { type: 'number' },
                      yearsToRetirement: { type: 'number' },
                      requiredCorpus: { type: 'number' },
                      monthlyExpenseAtRetirement: { type: 'number' },
                      monthlyInvestmentNeeded: { type: 'number' }
                    },
                    required: ['retirementAge', 'yearsToRetirement', 'requiredCorpus', 'monthlyExpenseAtRetirement', 'monthlyInvestmentNeeded']
                  }
                },
                withdrawalStrategies: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      strategyName: { type: 'string' },
                      swpRate: { type: 'number' },
                      monthlyIncome: { type: 'number' },
                      corpusRequired: { type: 'number' },
                      yearsCovered: { type: 'number' },
                      description: { type: 'string' }
                    },
                    required: ['strategyName', 'swpRate', 'monthlyIncome', 'corpusRequired', 'yearsCovered', 'description']
                  }
                },
                inflationAnalysis: {
                  type: 'object',
                  properties: {
                    currentMonthlyExpense: { type: 'number' },
                    inflationRate: { type: 'number' },
                    projections: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          year: { type: 'number' },
                          monthlyExpense: { type: 'number' },
                          annualExpense: { type: 'number' }
                        },
                        required: ['year', 'monthlyExpense', 'annualExpense']
                      }
                    }
                  },
                  required: ['currentMonthlyExpense', 'inflationRate', 'projections']
                },
                recommendations: {
                  type: 'object',
                  properties: {
                    immediate: { type: 'array', items: { type: 'string' } },
                    midTerm: { type: 'array', items: { type: 'string' } },
                    longTerm: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['immediate', 'midTerm', 'longTerm']
                },
                summary: { type: 'string' }
              },
              required: ['sipProjections', 'retirementTargets', 'withdrawalStrategies', 'inflationAnalysis', 'recommendations', 'summary'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_retirement' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

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
