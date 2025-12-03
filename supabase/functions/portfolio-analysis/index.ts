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
    
    const totalInvested = investmentsList.reduce((sum, inv) => 
      sum + (Number(inv.purchase_price) * Number(inv.quantity)), 0
    );
    
    const totalCurrentValue = investmentsList.reduce((sum, inv) => 
      sum + Number(inv.current_value || 0), 0
    );
    
    const totalReturns = totalCurrentValue - totalInvested;
    const returnsPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
    
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    
    investmentsList.forEach(inv => {
      const value = Number(inv.current_value || 0);
      byType[inv.investment_type] = (byType[inv.investment_type] || 0) + value;
      if (inv.category) {
        byCategory[inv.category] = (byCategory[inv.category] || 0) + value;
      }
    });

    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_KEY');
    if (!GOOGLE_AI_KEY) {
      throw new Error('GOOGLE_AI_KEY is not configured');
    }

    const systemPrompt = `You are an expert investment portfolio analyst. Analyze portfolios and provide comprehensive insights.

Format response as JSON:
{
  "overallScore": number,
  "diversificationScore": number,
  "riskLevel": "low|moderate|high|very_high",
  "performanceRating": "excellent|good|average|poor",
  "analysis": {
    "strengths": ["string"],
    "concerns": ["string"],
    "opportunities": ["string"]
  },
  "recommendations": {
    "immediate": ["string"],
    "shortTerm": ["string"],
    "longTerm": ["string"]
  },
  "assetAllocationAdvice": {
    "current": "string",
    "ideal": "string",
    "rebalancing": ["string"]
  },
  "taxOptimization": ["string"],
  "summary": "string"
}`;

    const userPrompt = `Analyze my investment portfolio:

Portfolio Summary:
- Total Invested: ₹${totalInvested.toLocaleString('en-IN')}
- Current Value: ₹${totalCurrentValue.toLocaleString('en-IN')}
- Total Returns: ₹${totalReturns.toLocaleString('en-IN')} (${returnsPercentage.toFixed(1)}%)

Number of Holdings: ${investmentsList.length}

By Investment Type:
${Object.entries(byType).map(([type, value]) => 
  `- ${type}: ₹${value.toLocaleString('en-IN')} (${totalCurrentValue > 0 ? ((value/totalCurrentValue)*100).toFixed(1) : 0}%)`
).join('\n')}

By Category:
${Object.entries(byCategory).map(([cat, value]) => 
  `- ${cat}: ₹${value.toLocaleString('en-IN')} (${totalCurrentValue > 0 ? ((value/totalCurrentValue)*100).toFixed(1) : 0}%)`
).join('\n')}

Individual Holdings:
${investmentsList.map(inv => {
  const invested = Number(inv.purchase_price) * Number(inv.quantity);
  const current = Number(inv.current_value || 0);
  const returns = current - invested;
  const returnsPct = invested > 0 ? (returns / invested) * 100 : 0;
  return `- ${inv.name} (${inv.investment_type}): Invested ₹${invested.toLocaleString('en-IN')}, Current ₹${current.toLocaleString('en-IN')}, Returns ${returnsPct.toFixed(1)}%`;
}).join('\n')}

Provide a comprehensive CA-level portfolio analysis with actionable recommendations.`;

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
