/**
 * ========================================
 * TEXT-TO-SPEECH - ElevenLabs Integration
 * ========================================
 * 
 * Converts text to speech using ElevenLabs API
 * Returns base64-encoded audio that can be played in the browser
 * 
 * VOICE CONFIGURATION:
 * - Default: George (deep male voice)
 * - Voice ID: JBFqnCBsd6RMkjVDRZzb
 * 
 * TO CHANGE VOICE:
 * 1. Get voice IDs from ElevenLabs dashboard
 * 2. Update the voiceId in the request body below
 * 
 * INDIAN ACCENT VOICES:
 * - For Indian accent, you can use ElevenLabs voice cloning
 * - Or request custom voices from ElevenLabs
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * CORS Headers - Required for browser requests
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Main request handler
 * 
 * FLOW:
 * 1. Handle CORS preflight
 * 2. Get text from request
 * 3. Call ElevenLabs API
 * 4. Return audio as base64
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { text, voiceId } = await req.json();
    
    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    /**
     * CREDIT OPTIMIZATION: Limit text length and sanitize Unicode
     * 
     * ElevenLabs charges per character. To save credits:
     * - Maximum 500 characters per request (adjust as needed)
     * - Remove emojis which count as characters and can cause encoding issues
     * - Truncate smartly at sentence boundaries
     */
    const MAX_CHARS = 500; // Adjust this to control costs
    
    // Comprehensive emoji and special character removal
    let optimizedText = text
      // Remove all emojis and symbols (comprehensive regex)
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
      .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Alchemical Symbols
      .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Geometric Shapes Extended
      .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Supplemental Arrows-C
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
      .replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation Selectors
      .replace(/[\u{1F000}-\u{1F02F}]/gu, '') // Mahjong Tiles
      .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '') // Playing Cards
      .replace(/[\u{200D}]/gu, '') // Zero Width Joiner
      .replace(/[\u{20E3}]/gu, '') // Combining Enclosing Keycap
      .replace(/[\u{FE0F}]/gu, '') // Variation Selector-16
      // Remove any remaining non-printable or surrogate characters
      .replace(/[\uD800-\uDFFF]/g, '') // Remove surrogate pairs
      .replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u0900-\u097F₹•–—''""…\n\r\t]/g, '') // Keep basic Latin, extended Latin, Devanagari, rupee, bullets
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (optimizedText.length > MAX_CHARS) {
      // Truncate at last sentence within limit
      const sentences = optimizedText.match(/[^.!?]+[.!?]+/g) || [];
      optimizedText = '';
      
      for (const sentence of sentences) {
        if ((optimizedText + sentence).length <= MAX_CHARS) {
          optimizedText += sentence;
        } else {
          break;
        }
      }
      
      // If no complete sentences fit, just truncate
      if (!optimizedText) {
        optimizedText = text.slice(0, MAX_CHARS) + '...';
      }
      
      console.log(`Text truncated from ${text.length} to ${optimizedText.length} characters`);
    }

    console.log(`Converting ${optimizedText.length} characters to speech (saves credits!)`);

    // Get ElevenLabs API key from environment
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    /**
     * CHECK CREDIT BALANCE BEFORE GENERATING
     * 
     * This helps warn users before they run out of credits
     */
    try {
      const subscriptionResponse = await fetch(
        'https://api.elevenlabs.io/v1/user/subscription',
        {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          },
        }
      );

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        const charCount = subscriptionData.character_count || 0;
        const charLimit = subscriptionData.character_limit || 10000;
        const remaining = charLimit - charCount;
        const percentUsed = (charCount / charLimit) * 100;

        console.log(`📊 ElevenLabs Credits: ${remaining.toLocaleString()} / ${charLimit.toLocaleString()} remaining (${percentUsed.toFixed(1)}% used)`);

        // Warn if credits are low
        if (percentUsed >= 90) {
          console.warn('🚨 WARNING: Less than 10% of ElevenLabs credits remaining!');
        } else if (percentUsed >= 75) {
          console.warn('⚠️ CAUTION: 75% of ElevenLabs credits used');
        }

        if (remaining < 100) {
          return new Response(JSON.stringify({ 
            error: 'ElevenLabs credits critically low. Please top up to continue using voice features.',
            credits_remaining: remaining
          }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (creditCheckError) {
      console.error('Could not check credit balance:', creditCheckError);
      // Continue anyway - don't block on credit check failure
    }

    /**
     * Voice Selection:
     * - George (JBFqnCBsd6RMkjVDRZzb): Deep male voice
     * - Callum (N2lVS1w4EtoT3dr4eOWO): Male voice
     * - Bill (pqHfZKP75CvOlQylNhV4): Male voice
     * 
     * TO USE INDIAN ACCENT:
     * 1. Go to ElevenLabs dashboard
     * 2. Use Voice Lab to clone an Indian accent voice
     * 3. Get the voice ID and replace below
     */
    const selectedVoiceId = voiceId || 'JBFqnCBsd6RMkjVDRZzb'; // George - deep male

    console.log(`Converting text to speech with voice: ${selectedVoiceId}`);

    /**
     * Call ElevenLabs Text-to-Speech API
     * 
     * CREDIT OPTIMIZATION: Using eleven_turbo_v2_5
     * - FASTER generation = lower costs
     * - Still high quality
     * - Best for saving credits
     * 
     * EDIT THIS to change model:
     * - eleven_multilingual_v2 (highest quality, more expensive)
     * - eleven_turbo_v2 (English only, faster)
     */
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: optimizedText, // Use optimized text instead of original
          model_id: 'eleven_turbo_v2_5', // Faster = cheaper
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      // Handle specific errors
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'ElevenLabs API error', 
        details: errorText 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    /**
     * Convert audio buffer to base64
     * 
     * CODING TIP: Base64 encoding is needed to send binary data in JSON
     * We process in chunks to avoid stack overflow with large audio files
     */
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 in chunks to avoid call stack size exceeded error
    let binary = '';
    const chunkSize = 8192; // Process 8KB at a time
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64Audio = btoa(binary);

    console.log(`✅ Generated ${arrayBuffer.byteLength} bytes audio for ${optimizedText.length} characters`);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * ========================================
 * HOW TO GET ELEVENLABS API KEY
 * ========================================
 * 
 * 1. Go to https://elevenlabs.io
 * 2. Sign up for a free account
 * 3. Go to Profile Settings > API Keys
 * 4. Click "Create New API Key"
 * 5. Copy the key and add it as ELEVENLABS_API_KEY secret
 * 
 * FREE TIER LIMITS:
 * - 10,000 characters per month
 * - 3 custom voices
 * - All voices available
 * 
 * ========================================
 * HOW TO USE INDIAN ACCENT
 * ========================================
 * 
 * Option 1: Voice Cloning (Recommended)
 * 1. Go to ElevenLabs Voice Lab
 * 2. Record or upload Indian accent voice samples
 * 3. Clone the voice
 * 4. Get the voice ID and use it in the request
 * 
 * Option 2: Professional Voice Cloning
 * 1. Upgrade to paid plan
 * 2. Request professional voice cloning
 * 3. Provide Indian accent voice samples
 * 
 * ========================================
 * DEBUGGING TIPS
 * ========================================
 * 
 * 1. Check Logs: View edge function logs in Supabase
 * 2. Test API Key: Verify key works in ElevenLabs dashboard
 * 3. Check Credits: Ensure you have remaining character quota
 * 4. Test Voice ID: Verify voice ID exists in your account
 */
