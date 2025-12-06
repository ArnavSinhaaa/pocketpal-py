import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number; // How strong the magnetic effect is (default: 0.3)
  radius?: number; // Detection radius multiplier (default: 1.5)
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Magnetic Button Component
 * Creates a button that follows the cursor when nearby, creating a magnetic effect.
 * Includes smooth spring animations and mobile-friendly touch feedback.
 */
export function MagneticButton({
  children,
  className = '',
  strength = 0.3,
  radius = 1.5,
  onClick,
  disabled = false,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    // Apply magnetic effect with strength factor
    setPosition({
      x: distanceX * strength,
      y: distanceY * strength,
    });
  }, [strength, disabled]);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  return (
    <motion.button
      ref={buttonRef}
      className={`relative transition-colors ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
      disabled={disabled}
      animate={{
        x: position.x,
        y: position.y,
        scale: isHovered ? 1.05 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 15,
        mass: 0.5,
      }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-inherit bg-primary/20 blur-xl -z-10"
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.2 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
      {children}
    </motion.button>
  );
}

/**
 * Magnetic wrapper for any element (not just buttons)
 */
interface MagneticWrapperProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: 'div' | 'span' | 'a';
}

export function MagneticWrapper({
  children,
  className = '',
  strength = 0.2,
  as = 'div',
}: MagneticWrapperProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setPosition({
      x: (e.clientX - centerX) * strength,
      y: (e.clientY - centerY) * strength,
    });
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  const MotionComponent = motion[as] as typeof motion.div;

  return (
    <MotionComponent
      ref={elementRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 20,
      }}
    >
      {children}
    </MotionComponent>
  );
}
