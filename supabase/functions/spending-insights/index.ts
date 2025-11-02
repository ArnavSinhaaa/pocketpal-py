/**
 * ========================================
 * SPENDING INSIGHTS - AI Expense Analysis Edge Function
 * ========================================
 * 
 * Analyzes user spending patterns and provides AI-powered insights:
 * - Identifies spending trends
 * - Detects saving opportunities
 * - Flags unusual spending
 * - Suggests budget improvements
 * 
 * DIFFERS FROM FINBUDDY: This is non-streaming, returns structured JSON
 * 
 * TECH STACK: Deno + Lovable AI Gateway + Supabase
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Request Handler
 * 
 * FLOW:
 * 1. Authenticate user
 * 2. Fetch expense history (last 100)
 * 3. Calculate spending statistics
 * 4. Call AI for analysis
 * 5. Parse and return JSON insights
 */
serve(async (req) => {
  // Handle CORS preflight
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

    // Initialize Supabase with user auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    /**
     * Fetch expense data
     * 
     * CODING TIP: Limit to 100 most recent expenses to keep AI context manageable
     * and response times fast. Adjust if needed!
     */
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(100);

    /**
     * Handle no data case
     * Return helpful default message instead of error
     */
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

    /**
     * Calculate spending statistics
     * 
     * CODING TIP: Do basic calculations here to reduce AI processing time
     * and give the AI structured data to analyze.
     */
    const totalSpending = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const categorySpending: Record<string, number> = {};
    const categoryCount: Record<string, number> = {};
    
    // Group by category
    expenses.forEach(exp => {
      const cat = exp.category;
      categorySpending[cat] = (categorySpending[cat] || 0) + Number(exp.amount);
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    // Get top 5 spending categories
    const topCategories = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        percentage: (amount / totalSpending * 100).toFixed(1),
        count: categoryCount[cat]
      }));

    /**
     * Format recent expenses for AI context
     */
    const recentExpenses = expenses.slice(0, 20).map(e => 
      `${e.category}: ₹${Number(e.amount).toLocaleString('en-IN')} - ${e.description || 'No description'}`
    ).join('\n');

    // Get AI API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
 
    /**
     * Call AI Gateway (Non-streaming)
     * 
     * IMPORTANT: stream: false means we get complete JSON response
     * This is different from FinBuddy which streams tokens!
     * 
     * EDIT THIS prompt to change what insights the AI provides
     */
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
            /**
             * System Prompt for Spending Analysis
             * 
             * EDIT THIS to change analysis focus or output format
             */
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

    // Handle AI Gateway errors
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

    /**
     * Parse AI response and extract JSON
     * 
     * CODING TIP: AI might wrap JSON in markdown code blocks.
     * Always clean it up before parsing!
     */
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Remove markdown code blocks if present
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].trim();
    }
    
    const insights = JSON.parse(jsonContent);

    // Return insights with top categories
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

/**
 * ========================================
 * CUSTOMIZATION GUIDE
 * ========================================
 * 
 * TO CHANGE ANALYSIS FOCUS:
 * Edit the system prompt (line ~95) to focus on different aspects
 * 
 * TO ADD MORE DATA SOURCES:
 * Fetch additional tables (goals, income, etc.) and add to context
 * 
 * TO CHANGE OUTPUT FORMAT:
 * Modify the JSON structure in the system prompt
 * 
 * TO IMPROVE PERFORMANCE:
 * - Reduce expense limit (currently 100)
 * - Cache results for X minutes
 * - Use gemini-2.5-flash-lite model
 */
