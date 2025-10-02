import confetti from 'canvas-confetti';

// Load confetti to window for easy access
if (typeof window !== 'undefined') {
  (window as any).confetti = confetti;
}

export { confetti };
