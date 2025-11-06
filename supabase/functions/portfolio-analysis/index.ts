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

    const { data: investments } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id);

    const investmentsList = investments || [];
    
    // Calculate portfolio metrics
    const totalInvested = investmentsList.reduce((sum, inv) => 
      sum + (Number(inv.purchase_price) * Number(inv.quantity)), 0
    );
    
    const totalCurrentValue = investmentsList.reduce((sum, inv) => 
      sum + Number(inv.current_value || 0), 0
    );
    
    const totalReturns = totalCurrentValue - totalInvested;
    const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
    
    // Group by type and category
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    
    investmentsList.forEach(inv => {
      const value = Number(inv.current_value || 0);
      byType[inv.investment_type] = (byType[inv.investment_type] || 0) + value;
      if (inv.category) {
        byCategory[inv.category] = (byCategory[inv.category] || 0) + value;
      }
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
            content: `You are an expert investment portfolio analyst with CA-level expertise. Analyze investment portfolios and provide comprehensive insights on:
- Portfolio diversification and risk assessment
- Asset allocation recommendations
- Performance analysis and benchmarking
- Tax efficiency strategies
- Rebalancing suggestions
- Growth opportunities

Format response as JSON:
{
  "overallScore": number (0-100),
  "diversificationScore": number (0-100),
  "riskLevel": "low|moderate|high|very_high",
  "performanceRating": "excellent|good|average|poor",
  "analysis": {
    "strengths": ["strength1", "strength2", ...],
    "concerns": ["concern1", "concern2", ...],
    "opportunities": ["opportunity1", "opportunity2", ...]
  },
  "recommendations": {
    "immediate": ["action1", "action2"],
    "shortTerm": ["action1", "action2"],
    "longTerm": ["action1", "action2"]
  },
  "assetAllocationAdvice": {
    "current": "description",
    "ideal": "description",
    "rebalancing": ["suggestion1", "suggestion2"]
  },
  "taxOptimization": ["tip1", "tip2", ...],
  "summary": "comprehensive analysis summary"
}`
          },
          {
            role: 'user',
            content: `Analyze my investment portfolio:

Portfolio Summary:
- Total Invested: ₹${totalInvested.toLocaleString('en-IN')}
- Current Value: ₹${totalCurrentValue.toLocaleString('en-IN')}
- Total Returns: ₹${totalReturns.toLocaleString('en-IN')} (${returnsPercentage.toFixed(1)}%)

Number of Holdings: ${investmentsList.length}

By Investment Type:
${Object.entries(byType).map(([type, value]) => 
  `- ${type}: ₹${value.toLocaleString('en-IN')} (${((value/totalCurrentValue)*100).toFixed(1)}%)`
).join('\n')}

By Category:
${Object.entries(byCategory).map(([cat, value]) => 
  `- ${cat}: ₹${value.toLocaleString('en-IN')} (${((value/totalCurrentValue)*100).toFixed(1)}%)`
).join('\n')}

Individual Holdings:
${investmentsList.map(inv => {
  const invested = Number(inv.purchase_price) * Number(inv.quantity);
  const current = Number(inv.current_value || 0);
  const returns = current - invested;
  const returnsPct = invested > 0 ? (returns / invested) * 100 : 0;
  return `- ${inv.name} (${inv.investment_type}): Invested ₹${invested.toLocaleString('en-IN')}, Current ₹${current.toLocaleString('en-IN')}, Returns ${returnsPct.toFixed(1)}%`;
}).join('\n')}

Provide a comprehensive CA-level portfolio analysis with actionable recommendations.`
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
    
    const analysisData = JSON.parse(jsonContent);

    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Portfolio analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});