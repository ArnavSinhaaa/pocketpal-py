import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FinBuddyMascotProps {
  /** Size of the mascot in pixels */
  size?: number;
  /** Primary color for the mascot body */
  primaryColor?: string;
  /** Secondary color for accents */
  secondaryColor?: string;
  /** Whether the button is being hovered */
  isHovered?: boolean;
  /** Whether the button was just clicked */
  isClicked?: boolean;
  /** Mouse position relative to button center (-1 to 1 range) */
  mousePosition?: { x: number; y: number };
}

/**
 * Cute mascot character for the FinBuddy button
 * Features:
 * - Idle bobbing animation (CSS keyframes)
 * - Eyes that follow cursor position
 * - Lean toward cursor on hover
 * - Joyful jump + sparkles on click
 */
export function FinBuddyMascot({
  size = 40,
  primaryColor = 'hsl(var(--primary))',
  secondaryColor = 'hsl(var(--primary-foreground))',
  isHovered = false,
  isClicked = false,
  mousePosition = { x: 0, y: 0 },
}: FinBuddyMascotProps) {
  const [showSparkles, setShowSparkles] = useState(false);

  // Trigger sparkles on click
  useEffect(() => {
    if (isClicked) {
      setShowSparkles(true);
      const timer = setTimeout(() => setShowSparkles(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isClicked]);

  // Calculate eye position based on mouse (limited range for cuteness)
  // Max movement is 2px in any direction
  const eyeOffsetX = Math.max(-2, Math.min(2, mousePosition.x * 2));
  const eyeOffsetY = Math.max(-2, Math.min(2, mousePosition.y * 2));

  // Calculate head tilt based on mouse position (subtle lean)
  // Max rotation is 8 degrees
  const headRotation = isHovered ? mousePosition.x * 8 : 0;
  const headTiltY = isHovered ? mousePosition.y * 3 : 0;

  return (
    <div 
      className="relative"
      style={{ width: size, height: size * 1.2 }}
    >
      {/* Sparkle burst on click */}
      <AnimatePresence>
        {showSparkles && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute pointer-events-none"
                style={{
                  left: '50%',
                  top: '30%',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: i % 2 === 0 ? '#FFD700' : '#FFA500',
                }}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0, 
                  opacity: 1 
                }}
                animate={{ 
                  x: Math.cos((i * 60) * Math.PI / 180) * 25,
                  y: Math.sin((i * 60) * Math.PI / 180) * 25 - 10,
                  scale: [0, 1.2, 0],
                  opacity: [1, 1, 0],
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ 
                  duration: 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main mascot body with idle animation */}
      <motion.div
        className="mascot-body"
        style={{
          width: size,
          height: size,
          position: 'relative',
        }}
        animate={{
          y: isClicked ? [-8, 0] : isHovered ? -2 : [0, -3, 0],
          rotate: headRotation,
          scale: isClicked ? [1, 1.1, 1] : isHovered ? 1.05 : 1,
        }}
        transition={
          isClicked 
            ? { duration: 0.3, ease: 'easeOut' }
            : isHovered 
              ? { duration: 0.2, ease: 'easeOut' }
              : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {/* Shadow underneath */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: size * 0.6,
            height: size * 0.15,
            left: '50%',
            bottom: -4,
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.15)',
            filter: 'blur(3px)',
          }}
          animate={{
            scale: isClicked ? [1, 0.7, 1] : isHovered ? 0.9 : [1, 0.85, 1],
            opacity: isClicked ? [0.3, 0.1, 0.3] : isHovered ? 0.2 : [0.3, 0.2, 0.3],
          }}
          transition={
            isClicked 
              ? { duration: 0.3, ease: 'easeOut' }
              : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }
        />

        {/* Main body (rounded blob shape) */}
        <div
          className="absolute rounded-[45%_45%_50%_50%] overflow-hidden"
          style={{
            width: size,
            height: size * 0.9,
            background: `linear-gradient(135deg, ${primaryColor} 0%, hsl(var(--primary) / 0.85) 100%)`,
            boxShadow: `
              0 4px 12px rgba(0,0,0,0.15),
              inset 0 -4px 8px rgba(0,0,0,0.1),
              inset 0 4px 8px rgba(255,255,255,0.2)
            `,
          }}
        >
          {/* Cheek blush (left) */}
          <div
            className="absolute rounded-full"
            style={{
              width: size * 0.18,
              height: size * 0.1,
              left: '12%',
              top: '52%',
              background: 'rgba(255,150,150,0.5)',
              filter: 'blur(2px)',
            }}
          />
          {/* Cheek blush (right) */}
          <div
            className="absolute rounded-full"
            style={{
              width: size * 0.18,
              height: size * 0.1,
              right: '12%',
              top: '52%',
              background: 'rgba(255,150,150,0.5)',
              filter: 'blur(2px)',
            }}
          />

          {/* Highlight shine */}
          <div
            className="absolute rounded-full"
            style={{
              width: size * 0.25,
              height: size * 0.2,
              left: '15%',
              top: '15%',
              background: 'rgba(255,255,255,0.35)',
              filter: 'blur(3px)',
            }}
          />
        </div>

        {/* Face container - moves with head tilt */}
        <motion.div
          className="absolute inset-0"
          animate={{
            y: headTiltY,
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {/* Left eye */}
          <div
            className="absolute rounded-full bg-white"
            style={{
              width: size * 0.22,
              height: size * 0.26,
              left: '22%',
              top: '28%',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {/* Pupil - follows cursor */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: size * 0.12,
                height: size * 0.14,
                background: '#2D3748',
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: -size * 0.06 + eyeOffsetX,
                y: -size * 0.07 + eyeOffsetY,
              }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            >
              {/* Eye shine */}
              <div
                className="absolute rounded-full bg-white"
                style={{
                  width: size * 0.04,
                  height: size * 0.04,
                  left: '20%',
                  top: '20%',
                }}
              />
            </motion.div>
          </div>

          {/* Right eye */}
          <div
            className="absolute rounded-full bg-white"
            style={{
              width: size * 0.22,
              height: size * 0.26,
              right: '22%',
              top: '28%',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {/* Pupil - follows cursor */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: size * 0.12,
                height: size * 0.14,
                background: '#2D3748',
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: -size * 0.06 + eyeOffsetX,
                y: -size * 0.07 + eyeOffsetY,
              }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
            >
              {/* Eye shine */}
              <div
                className="absolute rounded-full bg-white"
                style={{
                  width: size * 0.04,
                  height: size * 0.04,
                  left: '20%',
                  top: '20%',
                }}
              />
            </motion.div>
          </div>

          {/* Mouth - changes on click/hover */}
          <motion.div
            className="absolute"
            style={{
              left: '50%',
              top: '60%',
              transform: 'translateX(-50%)',
            }}
          >
            {isClicked ? (
              // Happy open mouth on click
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="rounded-full"
                style={{
                  width: size * 0.2,
                  height: size * 0.15,
                  background: '#2D3748',
                  borderRadius: '0 0 50% 50%',
                }}
              />
            ) : isHovered ? (
              // Smile on hover
              <div
                style={{
                  width: size * 0.18,
                  height: size * 0.08,
                  borderBottom: `${size * 0.03}px solid #2D3748`,
                  borderRadius: '0 0 50% 50%',
                }}
              />
            ) : (
              // Neutral small smile
              <div
                style={{
                  width: size * 0.12,
                  height: size * 0.05,
                  borderBottom: `${size * 0.025}px solid #2D3748`,
                  borderRadius: '0 0 40% 40%',
                }}
              />
            )}
          </motion.div>
        </motion.div>

        {/* Small ears/antennae */}
        <div
          className="absolute rounded-full"
          style={{
            width: size * 0.15,
            height: size * 0.15,
            left: '5%',
            top: '-5%',
            background: primaryColor,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: size * 0.15,
            height: size * 0.15,
            right: '5%',
            top: '-5%',
            background: primaryColor,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        />
      </motion.div>
    </div>
  );
}

/**
 * Hook to handle mouse tracking for the mascot
 * Returns mouse position normalized to -1 to 1 range relative to element center
 */
export function useMascotInteraction(ref: React.RefObject<HTMLElement | null>) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current || isTouchDevice) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalize to -1 to 1 range
    const x = Math.max(-1, Math.min(1, (e.clientX - centerX) / (rect.width / 2)));
    const y = Math.max(-1, Math.min(1, (e.clientY - centerY) / (rect.height / 2)));

    setMousePosition({ x, y });
  }, [ref, isTouchDevice]);

  const handleMouseEnter = useCallback(() => {
    if (!isTouchDevice) setIsHovered(true);
  }, [isTouchDevice]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  }, []);

  const handleClick = useCallback(() => {
    setIsClicked(true);
    // Reset after animation
    setTimeout(() => setIsClicked(false), 400);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('click', handleClick);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('click', handleClick);
    };
  }, [ref, handleMouseMove, handleMouseEnter, handleMouseLeave, handleClick]);

  return { isHovered, isClicked, mousePosition, isTouchDevice };
}
