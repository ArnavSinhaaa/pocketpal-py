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

    // Fetch expense data
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(100);

    if (!expenses || expenses.length === 0) {
      return new Response(JSON.stringify({
        patterns: [],
        savingOpportunities: ["Start tracking expenses to get personalized insights!"],
        topCategories: [],
        unusualSpending: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate statistics
    const totalSpending = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const categorySpending: Record<string, number> = {};
    const categoryCount: Record<string, number> = {};
    
    expenses.forEach(exp => {
      const cat = exp.category;
      categorySpending[cat] = (categorySpending[cat] || 0) + Number(exp.amount);
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const topCategories = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: (amount / totalSpending * 100).toFixed(1),
        count: categoryCount[cat]
      }));

    const recentExpenses = expenses.slice(0, 20).map(e => 
      `${e.category}: ₹${Number(e.amount).toLocaleString('en-IN')} - ${e.description || 'No description'}`
    ).join('\n');

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
            content: `You are an expert financial analyst specializing in spending pattern detection. Analyze transaction data to find opportunities to save money.

Your task:
1. Identify spending patterns and trends
2. Detect areas where user can save money
3. Find unusual or excessive spending
4. Provide actionable, specific recommendations
5. Focus on Indian context (delivery apps, shopping, utilities, etc.)

Format response as JSON:
{
  "patterns": ["pattern1", "pattern2", ...],
  "savingOpportunities": [
    { "category": "string", "current": number, "potential": number, "tip": "string" }
  ],
  "unusualSpending": ["observation1", "observation2", ...],
  "recommendations": ["rec1", "rec2", ...]
}`
          },
          {
            role: 'user',
            content: `Analyze my spending and tell me where I can save:

Total Spending: ₹${totalSpending.toLocaleString('en-IN')}
Number of Transactions: ${expenses.length}

Top Spending Categories:
${topCategories.map(c => `- ${c.category}: ₹${c.amount.toLocaleString('en-IN')} (${c.percentage}%, ${c.count} transactions)`).join('\n')}

Recent Transactions:
${recentExpenses}

Please identify patterns and provide specific saving opportunities with realistic estimates.`
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
    
    const insights = JSON.parse(jsonContent);

    return new Response(JSON.stringify({
      ...insights,
      topCategories
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Spending insights error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
