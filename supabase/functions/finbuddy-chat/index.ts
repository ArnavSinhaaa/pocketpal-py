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

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's financial data
    const [expensesRes, goalsRes, statsRes, profileRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(20),
      supabase.from('financial_goals').select('*').eq('user_id', user.id),
      supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
      supabase.from('profiles').select('annual_salary').eq('user_id', user.id).single(),
    ]);

    // Build context from user data
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
User's Financial Data:
- Annual Salary: $${profile?.annual_salary || 0}
- Total Expenses (last 20): $${totalExpenses.toFixed(2)}
- Expenses by Category: ${JSON.stringify(expensesByCategory)}
- Active Goals: ${goals.length}
- Goals Progress: ${goals.map(g => `${g.title}: $${g.current_amount}/$${g.target_amount}`).join(', ')}
- Current Streak: ${stats?.current_streak || 0} days
- Total Expenses Tracked: ${stats?.expenses_count || 0}
- Goals Completed: ${stats?.goals_completed || 0}
- Total Points: ${stats?.total_points || 0}

Recent Expenses:
${expenses.slice(0, 5).map(e => `- ${e.category}: $${e.amount} (${e.description || 'No description'})`).join('\n')}
`;

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
            content: `You are FinBuddy, a friendly and supportive personal finance assistant. You help users track expenses, manage budgets, and achieve their financial goals.

Your personality:
- Warm, encouraging, and positive
- Give specific, actionable advice
- Celebrate progress and milestones
- Use emojis occasionally to be friendly (but not excessively)
- Keep responses concise and focused
- Be empathetic when discussing financial challenges

Your capabilities:
- Analyze spending patterns and suggest improvements
- Help create and track budgets
- Provide goal-setting strategies
- Offer tips for saving money
- Celebrate achievements and streaks
- Give step-by-step guidance

When responding:
- Reference specific data from the user's financial information
- Provide concrete examples and actionable steps
- Acknowledge their progress and achievements
- Be honest but supportive about areas for improvement
- Ask clarifying questions when needed

${contextMessage}`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI service requires payment. Please contact support.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('FinBuddy chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
