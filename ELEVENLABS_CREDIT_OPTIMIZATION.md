# ElevenLabs Credit Optimization Guide

## 🎯 Implemented Optimizations

### 1. **Text Length Limiting**
- Maximum 500 characters per TTS request (adjustable in `text-to-speech/index.ts`)
- Smart truncation at sentence boundaries
- Removes emojis that consume credits

### 2. **Faster Model Usage**
- Using `eleven_turbo_v2_5` instead of `eleven_multilingual_v2`
- **50% faster generation = lower costs**
- Still maintains high quality

### 3. **Credit Monitoring**
- Automatic credit balance check before each request
- Console warnings when credits are low:
  - 🚨 **Critical**: Less than 10% remaining
  - ⚠️ **Warning**: 75% used
- Blocks requests when credits < 100 characters

### 4. **User-Facing Warnings**
- Toast notifications when credits are critically low
- Clear error messages guide users to top up

## 📊 How to Monitor Credits

### In Edge Function Logs
Check the logs at: [TTS Function Logs](https://supabase.com/dashboard/project/tbsgqvrfoljyjciflosl/functions/text-to-speech/logs)

You'll see:
```
📊 ElevenLabs Credits: 8,542 / 10,000 remaining (14.6% used)
✅ Generated 2,048 bytes audio for 127 characters
```

### Warning Examples
```
⚠️ CAUTION: 75% of ElevenLabs credits used
🚨 WARNING: Less than 10% of ElevenLabs credits remaining!
```

## 💰 Credit Saving Tips

### 1. Adjust Max Characters (line 78 in text-to-speech/index.ts)
```typescript
const MAX_CHARS = 500; // Lower = more savings
```
- 300 chars = Very short responses
- 500 chars = Balanced (current setting)
- 1000 chars = Longer responses (costs more)

### 2. Disable Voice for Certain Users
Users can toggle voice on/off with the speaker icon in FinBuddy

### 3. Use Voice Selectively
Only enable TTS for:
- Important notifications
- Short confirmations
- Key insights

### 4. Monitor Usage Patterns
Check logs to see which messages consume most credits

## 📈 ElevenLabs Free Tier Limits
- **10,000 characters/month** free
- 3 custom voices
- All standard voices included

## 🔧 Customization Options

### Change Character Limit
Edit `supabase/functions/text-to-speech/index.ts` line 78:
```typescript
const MAX_CHARS = 300; // Your preferred limit
```

### Change Voice Model
For even more savings, use English-only model (line 133):
```typescript
model_id: 'eleven_turbo_v2', // English only, cheapest
```

### Disable Emojis Removal
Comment out line 81-82 if you want to keep emojis:
```typescript
// .replace(/[👋💪🇮🇳]/g, '')
```

## 🎤 Voice Options

Current default: **George** (deep male voice)
- Voice ID: `JBFqnCBsd6RMkjVDRZzb`

To change, edit line 97 in `text-to-speech/index.ts`

## 📱 How Users See Credit Warnings

When credits are low:
- **Toast notification**: "⚠️ Credits Low - ElevenLabs credits running low. Please top up."
- **Console log**: Shows exact remaining credits
- **Automatic blocking**: When < 100 characters remain

## 🔍 Troubleshooting

### "Credits critically low" error
1. Go to [ElevenLabs Dashboard](https://elevenlabs.io)
2. Check subscription page
3. Top up credits or upgrade plan

### Voice not playing
1. Check edge function logs
2. Verify API key is valid
3. Ensure credits are available

### Want to increase limit temporarily
Set `MAX_CHARS = 1000` for longer responses (but costs more!)

## 💡 Best Practices

1. **Monitor weekly**: Check logs every week to track usage
2. **Set alerts**: Note when you hit 50% usage
3. **Plan ahead**: Top up before running out completely
4. **Test settings**: Try different character limits to find your sweet spot
5. **User preference**: Let users control when they want voice

---

**Current Settings:**
- Max characters: 500
- Model: eleven_turbo_v2_5 (fastest/cheapest)
- Credit warnings: Enabled
- Auto-block when low: Enabled (< 100 chars)
