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

    const totalInvestments = investments.reduce((sum, inv) => sum + Number(inv.current_value || 0), 0);
    const totalAssets = assets.reduce((sum, asset) => sum + Number(asset.current_value), 0);
    const totalLiabilities = liabilities.reduce((sum, lib) => sum + Number(lib.outstanding_amount), 0);
    
    const totalAssetValue = totalInvestments + totalAssets;
    const netWorth = totalAssetValue - totalLiabilities;
    
    const assetBreakdown: Record<string, number> = { investments: totalInvestments };
    assets.forEach(asset => {
      assetBreakdown[asset.asset_type] = (assetBreakdown[asset.asset_type] || 0) + Number(asset.current_value);
    });
    
    const liabilityBreakdown: Record<string, number> = {};
    liabilities.forEach(lib => {
      liabilityBreakdown[lib.liability_type] = (liabilityBreakdown[lib.liability_type] || 0) + Number(lib.outstanding_amount);
    });

    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_KEY');
    if (!GOOGLE_AI_KEY) {
      throw new Error('GOOGLE_AI_KEY is not configured');
    }

    const systemPrompt = `You are a CA-level wealth management analyst. Analyze net worth data and provide expert financial insights.

Format response as JSON:
{
  "financialRatios": {
    "debtToAssetRatio": number,
    "liquidityRatio": number,
    "solvencyRatio": number,
    "interpretation": "string"
  },
  "wealthGrade": "A+|A|B|C|D",
  "analysis": {
    "strengths": ["string"],
    "concerns": ["string"],
    "opportunities": ["string"]
  },
  "netWorthGrowthPlan": {
    "shortTerm": {"target": number, "timeframe": "string", "actions": ["string"]},
    "mediumTerm": {"target": number, "timeframe": "string", "actions": ["string"]},
    "longTerm": {"target": number, "timeframe": "string", "actions": ["string"]}
  },
  "recommendations": {
    "assetOptimization": ["string"],
    "debtManagement": ["string"],
    "wealthBuilding": ["string"]
  },
  "milestones": [{"milestone": "string", "targetAmount": number, "estimatedTimeframe": "string"}],
  "summary": "string"
}`;

    const userPrompt = `Analyze my complete net worth:

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
  `- ${type}: ₹${value.toLocaleString('en-IN')} (${totalLiabilities > 0 ? ((value/totalLiabilities)*100).toFixed(1) : 0}%)`
).join('\n')}

Financial Goals: ${goals.length} active goals totaling ₹${goals.reduce((sum, g) => sum + Number(g.target_amount), 0).toLocaleString('en-IN')}

Provide a CA-level net worth analysis with specific strategies to optimize wealth.`;

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
    
    const analysisData = JSON.parse(jsonContent);

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
