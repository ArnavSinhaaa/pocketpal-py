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
    const { messages } = await req.json();
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

    const [expensesRes, goalsRes, statsRes, profileRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(20),
      supabase.from('financial_goals').select('*').eq('user_id', user.id),
      supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
      supabase.from('profiles').select('annual_salary').eq('user_id', user.id).single(),
    ]);

    const expenses = expensesRes.data || [];
    const goals = goalsRes.data || [];
    const stats = statsRes.data;
    const profile = profileRes.data;

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const expensesByCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

    const contextMessage = `
User's Financial Data (All amounts in Indian Rupees):
- Annual Salary: ₹${profile?.annual_salary?.toLocaleString('en-IN') || 0}
- Total Expenses (last 20): ₹${totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
- Expenses by Category: ${Object.entries(expensesByCategory).map(([k, v]) => `${k}: ₹${v.toLocaleString('en-IN')}`).join(', ')}
- Active Goals: ${goals.length}
- Goals Progress: ${goals.map(g => `${g.title}: ₹${Number(g.current_amount).toLocaleString('en-IN')}/₹${Number(g.target_amount).toLocaleString('en-IN')}`).join(', ')}
- Current Streak: ${stats?.current_streak || 0} days
- Total Expenses Tracked: ${stats?.expenses_count || 0}
- Goals Completed: ${stats?.goals_completed || 0}
- Total Points: ${stats?.total_points || 0}

Recent Expenses:
${expenses.slice(0, 5).map(e => `- ${e.category}: ₹${Number(e.amount).toLocaleString('en-IN')} (${e.description || 'No description'})`).join('\n')}
`;

    const GOOGLE_AI_KEY = Deno.env.get('GOOGLE_AI_KEY');
    if (!GOOGLE_AI_KEY) {
      throw new Error('GOOGLE_AI_KEY is not configured');
    }

    const systemPrompt = `You are FinBuddy, a friendly personal finance assistant specialized in Indian financial planning. You help users track expenses, manage budgets, save taxes, and achieve financial goals.

Your personality: Warm, encouraging, positive. Give specific, actionable advice relevant to India. Use emojis occasionally. Keep responses concise.

Your capabilities:
- Analyze spending patterns
- Help with budgets suitable for Indian lifestyle
- Offer tax-saving tips (Section 80C, 80D, NPS, HRA, etc.)
- Suggest Indian investment options (ELSS, PPF, EPF, NPS, Mutual Funds, FDs)
- Explain tax slabs in plain language

Always use Indian Rupees (₹) and format with Indian numbering (lakhs, crores).

${contextMessage}`;

    // Build messages for Gemini format
    const geminiMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood! I am FinBuddy, your friendly Indian financial assistant. How can I help you today?' }] },
          ...geminiMessages
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
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
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    // Return as non-streaming response with the content
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('FinBuddy chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
