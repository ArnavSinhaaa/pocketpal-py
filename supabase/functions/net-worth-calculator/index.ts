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

    const [investmentsRes, assetsRes, liabilitiesRes, goalsRes] = await Promise.all([
      supabase.from('investments').select('*').eq('user_id', user.id),
      supabase.from('assets').select('*').eq('user_id', user.id),
      supabase.from('liabilities').select('*').eq('user_id', user.id),
      supabase.from('financial_goals').select('*').eq('user_id', user.id),
    ]);

    const investments = investmentsRes.data || [];
    const assets = assetsRes.data || [];
    const liabilities = liabilitiesRes.data || [];
    const goals = goalsRes.data || [];

    // Calculate totals
    const totalInvestments = investments.reduce((sum, inv) => sum + Number(inv.current_value || 0), 0);
    const totalAssets = assets.reduce((sum, asset) => sum + Number(asset.current_value), 0);
    const totalLiabilities = liabilities.reduce((sum, lib) => sum + Number(lib.outstanding_amount), 0);
    
    const totalAssetValue = totalInvestments + totalAssets;
    const netWorth = totalAssetValue - totalLiabilities;
    
    // Asset breakdown
    const assetBreakdown: Record<string, number> = {
      investments: totalInvestments,
    };
    
    assets.forEach(asset => {
      assetBreakdown[asset.asset_type] = (assetBreakdown[asset.asset_type] || 0) + Number(asset.current_value);
    });
    
    // Liability breakdown
    const liabilityBreakdown: Record<string, number> = {};
    liabilities.forEach(lib => {
      liabilityBreakdown[lib.liability_type] = (liabilityBreakdown[lib.liability_type] || 0) + Number(lib.outstanding_amount);
    });

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
            content: 'You are a CA-level wealth management analyst. Analyze net worth data and provide expert financial insights.'
          },
          {
            role: 'user',
            content: `Analyze my complete net worth:

Net Worth Summary:
- Total Assets: ₹${totalAssetValue.toLocaleString('en-IN')}
- Total Liabilities: ₹${totalLiabilities.toLocaleString('en-IN')}
- Net Worth: ₹${netWorth.toLocaleString('en-IN')}

Asset Breakdown:
${Object.entries(assetBreakdown).map(([type, value]) => 
  `- ${type}: ₹${value.toLocaleString('en-IN')} (${((value/totalAssetValue)*100).toFixed(1)}%)`
).join('\n')}

Liability Breakdown:
${Object.entries(liabilityBreakdown).map(([type, value]) => 
  `- ${type}: ₹${value.toLocaleString('en-IN')} (${((value/totalLiabilities)*100).toFixed(1)}%)`
).join('\n')}

Financial Goals: ${goals.length} active goals totaling ₹${goals.reduce((sum, g) => sum + Number(g.target_amount), 0).toLocaleString('en-IN')}

Provide a CA-level net worth analysis with specific strategies to optimize wealth and achieve financial independence.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_net_worth',
            description: 'Provide comprehensive net worth analysis with financial ratios and recommendations',
            parameters: {
              type: 'object',
              properties: {
                financialRatios: {
                  type: 'object',
                  properties: {
                    debtToAssetRatio: { type: 'number' },
                    liquidityRatio: { type: 'number' },
                    solvencyRatio: { type: 'number' },
                    interpretation: { type: 'string' }
                  },
                  required: ['debtToAssetRatio', 'liquidityRatio', 'solvencyRatio', 'interpretation']
                },
                wealthGrade: { type: 'string', enum: ['A+', 'A', 'B', 'C', 'D'] },
                analysis: {
                  type: 'object',
                  properties: {
                    strengths: { type: 'array', items: { type: 'string' } },
                    concerns: { type: 'array', items: { type: 'string' } },
                    opportunities: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['strengths', 'concerns', 'opportunities']
                },
                netWorthGrowthPlan: {
                  type: 'object',
                  properties: {
                    shortTerm: {
                      type: 'object',
                      properties: {
                        target: { type: 'number' },
                        timeframe: { type: 'string' },
                        actions: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['target', 'timeframe', 'actions']
                    },
                    mediumTerm: {
                      type: 'object',
                      properties: {
                        target: { type: 'number' },
                        timeframe: { type: 'string' },
                        actions: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['target', 'timeframe', 'actions']
                    },
                    longTerm: {
                      type: 'object',
                      properties: {
                        target: { type: 'number' },
                        timeframe: { type: 'string' },
                        actions: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['target', 'timeframe', 'actions']
                    }
                  },
                  required: ['shortTerm', 'mediumTerm', 'longTerm']
                },
                recommendations: {
                  type: 'object',
                  properties: {
                    assetOptimization: { type: 'array', items: { type: 'string' } },
                    debtManagement: { type: 'array', items: { type: 'string' } },
                    wealthBuilding: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['assetOptimization', 'debtManagement', 'wealthBuilding']
                },
                milestones: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      milestone: { type: 'string' },
                      targetAmount: { type: 'number' },
                      estimatedTimeframe: { type: 'string' }
                    },
                    required: ['milestone', 'targetAmount', 'estimatedTimeframe']
                  }
                },
                summary: { type: 'string' }
              },
              required: ['financialRatios', 'wealthGrade', 'analysis', 'netWorthGrowthPlan', 'recommendations', 'milestones', 'summary']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_net_worth' } }
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
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || !toolCall.function?.arguments) {
      console.error('No tool call in response:', JSON.stringify(data));
      throw new Error('AI did not return structured data');
    }
    
    const analysisData = JSON.parse(toolCall.function.arguments);

    // Add actual values to response
    const enrichedData = {
      ...analysisData,
      actualValues: {
        totalAssets: totalAssetValue,
        totalLiabilities: totalLiabilities,
        netWorth: netWorth,
        assetBreakdown,
        liabilityBreakdown,
      }
    };

    return new Response(JSON.stringify(enrichedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Net worth calculator error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});