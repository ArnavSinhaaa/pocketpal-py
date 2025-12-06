import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, X, Volume2, VolumeX, Sparkles, TrendingUp, Wallet, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FinBuddyMascot, useMascotInteraction, type MascotExpression } from './FinBuddyMascot';

/** 
 * Reusable button component with cute mascot
 * Can be customized with different labels
 */
function FinBuddyButton({ 
  onClick, 
  label = 'FinBuddy',
  expression = 'idle' 
}: { 
  onClick: () => void; 
  label?: string;
  expression?: MascotExpression;
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { isHovered, isClicked, mousePosition } = useMascotInteraction(buttonRef);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <div 
        ref={buttonRef}
        className="relative cursor-pointer"
        onClick={onClick}
      >
        {/* Mascot sitting above the button */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <FinBuddyMascot
            size={36}
            isHovered={isHovered}
            isClicked={isClicked}
            mousePosition={mousePosition}
            expression={expression}
          />
        </div>

        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        
        {/* Main button */}
        <motion.div
          className="relative h-16 w-16 rounded-full shadow-glow bg-gradient-to-br from-primary via-primary to-primary/80 border-2 border-primary-foreground/20 flex items-center justify-center"
          animate={{
            scale: isClicked ? 0.95 : isHovered ? 1.1 : 1,
            y: isHovered ? -2 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 17,
          }}
          style={{
            boxShadow: isHovered 
              ? '0 8px 30px rgba(124, 58, 237, 0.5), 0 4px 15px rgba(124, 58, 237, 0.3)'
              : '0 4px 15px rgba(124, 58, 237, 0.3)',
          }}
        >
          <div className="flex flex-col items-center">
            <Sparkles className="h-5 w-5 text-white mb-0.5" />
            <span className="text-[10px] font-bold text-white">{label}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const quickPrompts = [
  { icon: TrendingUp, label: 'Analyze spending', prompt: 'Analyze my spending patterns and suggest improvements' },
  { icon: Wallet, label: 'Save tax', prompt: 'How can I save more tax this financial year?' },
  { icon: Target, label: 'Goal advice', prompt: 'Help me plan to reach my financial goals faster' },
];

export function FinBuddy() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "👋 Namaste! I'm FinBuddy, your personal finance expert!\n\nI can help you with:\n• 📊 Analyzing your spending patterns\n• 💰 Tax-saving strategies (80C, 80D, NPS)\n• 📈 Investment recommendations\n• 🎯 Achieving your financial goals\n\nHow can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const playAudio = async (text: string) => {
    if (!isAudioEnabled || !text) return;
    
    try {
      setIsSpeaking(true);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text }
      });

      if (error) {
        console.error('TTS error:', error);
        if (error.message?.includes('Rate limit')) {
          toast({ title: 'Voice rate limit', description: 'Try again later.', variant: 'destructive' });
        } else if (error.message?.includes('credits')) {
          toast({ title: '⚠️ Credits Low', description: 'ElevenLabs credits running low.', variant: 'destructive' });
        }
        return;
      }

      if (!data?.audioContent) return;

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.play().catch(err => {
        console.error('Audio playback error:', err);
        setIsSpeaking(false);
      });

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsSpeaking(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const toggleAudio = () => {
    if (isAudioEnabled && isSpeaking) {
      stopAudio();
    }
    setIsAudioEnabled(!isAudioEnabled);
    toast({ title: isAudioEnabled ? '🔇 Voice disabled' : '🔊 Voice enabled' });
  };

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to chat with FinBuddy',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/finbuddy-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, { role: 'user', content: userMessage }],
          }),
        }
      );

      if (!response.ok) {
        let errorData: any = {};
        try { errorData = await response.json(); } catch {}
        if (response.status === 429) {
          toast({ title: 'AI rate limit', description: 'Too many requests. Please wait and try again.', variant: 'destructive' });
          throw new Error('Rate limit exceeded');
        }
        if (response.status === 402) {
          toast({ title: 'AI credits required', description: 'Please add credits to continue using FinBuddy.', variant: 'destructive' });
          throw new Error('Payment required');
        }
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let textBuffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;

        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            // Handle Gemini SSE format
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: 'assistant',
                  content: assistantMessage,
                };
                return newMessages;
              });
            }
          } catch {
            // Incomplete JSON, continue
          }
        }
      }

      if (assistantMessage) {
        await playAudio(assistantMessage);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
      setMessages(prev => prev.slice(0, -1));
      setIsLoading(false);
    }
  };

  const formatMessage = (content: string) => {
    // Convert markdown-like formatting to styled elements
    return content.split('\n').map((line, i) => {
      // Handle bullet points
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={i} className="flex items-start gap-2 my-1">
            <span className="text-primary mt-0.5">•</span>
            <span>{line.slice(2)}</span>
          </div>
        );
      }
      // Handle numbered lists
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={i} className="flex items-start gap-2 my-1">
            <span className="text-primary font-medium">{line.match(/^\d+/)?.[0]}.</span>
            <span>{line.replace(/^\d+\.\s/, '')}</span>
          </div>
        );
      }
      // Handle bold text **text**
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className={line ? 'my-1' : 'my-2'}>
            {parts.map((part, j) => 
              j % 2 === 1 ? <strong key={j} className="text-primary font-semibold">{part}</strong> : part
            )}
          </p>
        );
      }
      return <p key={i} className={line ? 'my-1' : 'my-2'}>{line}</p>;
    });
  };

  // Determine mascot expression based on chat state
  const getMascotExpression = (): MascotExpression => {
    if (isSpeaking) return 'speaking';
    if (isLoading) return 'thinking';
    return 'idle';
  };

  return (
    <>
      {/* Floating chat button with mascot */}
      <AnimatePresence>
        {!isOpen && (
          <FinBuddyButton 
            onClick={() => setIsOpen(true)} 
            expression={getMascotExpression()}
          />
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-0 overflow-hidden bg-gradient-to-b from-card to-card/95 backdrop-blur-xl">
              {/* Header with gradient */}
              <CardHeader className="bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground p-4 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-11 w-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      {/* Online indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-400 rounded-full border-2 border-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        FinBuddy
                        <Sparkles className="h-4 w-4 text-yellow-300" />
                      </h3>
                      <p className="text-xs text-white/80">
                        {isSpeaking ? '🔊 Speaking...' : isLoading ? '💭 Thinking...' : '🟢 Online'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleAudio}
                      className="text-white hover:bg-white/20 h-9 w-9"
                      title={isAudioEnabled ? 'Disable voice' : 'Enable voice'}
                    >
                      {isAudioEnabled ? (
                        <Volume2 className="h-5 w-5" />
                      ) : (
                        <VolumeX className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/20 h-9 w-9"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Messages area */}
                <ScrollArea className="h-[380px] px-4 py-3" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted/80 border border-border/50 rounded-bl-md'
                          }`}
                        >
                          <div className="text-sm leading-relaxed">
                            {message.role === 'assistant' 
                              ? formatMessage(message.content)
                              : message.content
                            }
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Loading indicator */}
                    {isLoading && messages[messages.length - 1]?.content === '' && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted/80 border border-border/50 rounded-2xl rounded-bl-md px-5 py-4">
                          <div className="flex gap-1.5">
                            <motion.div
                              className="w-2.5 h-2.5 bg-primary/60 rounded-full"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            />
                            <motion.div
                              className="w-2.5 h-2.5 bg-primary/60 rounded-full"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                            />
                            <motion.div
                              className="w-2.5 h-2.5 bg-primary/60 rounded-full"
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>

                {/* Quick prompts */}
                {messages.length === 1 && !isLoading && (
                  <div className="px-4 pb-3 border-t border-border/50 bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2 mt-3">Quick actions:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickPrompts.map((qp, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          onClick={() => sendMessage(qp.prompt)}
                          className="text-xs h-8 rounded-full hover:bg-primary/10 hover:border-primary/50 transition-all"
                        >
                          <qp.icon className="h-3 w-3 mr-1.5" />
                          {qp.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input area */}
                <div className="p-4 border-t border-border/50 bg-background/80">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about expenses, taxes, investments..."
                      disabled={isLoading}
                      className="flex-1 rounded-full border-muted-foreground/20 focus:border-primary/50 bg-muted/50"
                    />
                    <Button 
                      type="submit" 
                      disabled={isLoading || !input.trim()} 
                      size="icon"
                      className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90 shadow-md"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Powered by AI • Your data stays private
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
