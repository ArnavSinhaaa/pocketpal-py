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

    // Get ElevenLabs API key from environment
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
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
     * MODEL: eleven_multilingual_v2
     * - Supports multiple languages including Indian accents
     * - High quality, emotionally rich
     * 
     * EDIT THIS to change model:
     * - eleven_turbo_v2_5 (faster, lower latency)
     * - eleven_multilingual_v1 (older model)
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
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
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
     * The client will decode this and create an audio blob
     */
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    console.log(`Successfully generated audio (${arrayBuffer.byteLength} bytes)`);

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
