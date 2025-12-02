import { forwardRef, ReactNode, useState } from 'react';
import { Card } from '@/components/ui/card';
import { use3DTilt } from '@/hooks/use3DTilt';
import { cn } from '@/lib/utils';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  maxTilt?: number;
  scale?: number;
  glare?: boolean;
  glow?: boolean;
  glowColor?: string;
  children: ReactNode;
}

export const TiltCard = forwardRef<HTMLDivElement, TiltCardProps>(
  ({ className, maxTilt = 8, scale = 1.02, glare = true, glow = true, glowColor, children, ...props }, externalRef) => {
    const { ref } = use3DTilt({ maxTilt, scale, glare });
    const [isHovered, setIsHovered] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePosition({ x, y });
    };

    return (
      <Card
        ref={ref}
        className={cn(
          'relative overflow-hidden transition-all duration-500',
          isHovered && glow && 'shadow-glow-hover',
          className
        )}
        style={{
          transformStyle: 'preserve-3d',
          '--glow-x': `${mousePosition.x}%`,
          '--glow-y': `${mousePosition.y}%`,
        } as React.CSSProperties}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        {...props}
      >
        {/* Glow effect layer */}
        {glow && (
          <div
            className={cn(
              'absolute inset-0 pointer-events-none transition-opacity duration-500 rounded-[inherit]',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              background: `radial-gradient(600px circle at var(--glow-x, 50%) var(--glow-y, 50%), hsl(var(--primary) / 0.15), transparent 40%)`,
            }}
          />
        )}
        
        {/* Border glow effect */}
        {glow && (
          <div
            className={cn(
              'absolute inset-0 pointer-events-none transition-opacity duration-500 rounded-[inherit]',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              background: `radial-gradient(400px circle at var(--glow-x, 50%) var(--glow-y, 50%), hsl(var(--primary) / 0.3), transparent 40%)`,
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'xor',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />
        )}
        
        {/* Glare effect */}
        {glare && (
          <div
            className={cn(
              'absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-[inherit]',
              isHovered ? 'opacity-20' : 'opacity-0'
            )}
            style={{
              background:
                'radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.4) 0%, transparent 50%)',
            }}
          />
        )}
        
        <div style={{ transform: 'translateZ(20px)' }}>{children}</div>
      </Card>
    );
  }
);

TiltCard.displayName = 'TiltCard';

// Simple glow card without tilt effect
export const GlowCard = forwardRef<HTMLDivElement, Omit<TiltCardProps, 'maxTilt' | 'scale' | 'glare'>>(
  ({ className, glow = true, children, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePosition({ x, y });
    };

    return (
      <Card
        ref={ref}
        className={cn(
          'relative overflow-hidden transition-all duration-500',
          isHovered && glow && 'shadow-glow-hover',
          className
        )}
        style={{
          '--glow-x': `${mousePosition.x}%`,
          '--glow-y': `${mousePosition.y}%`,
        } as React.CSSProperties}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        {...props}
      >
        {/* Glow effect layer */}
        {glow && (
          <div
            className={cn(
              'absolute inset-0 pointer-events-none transition-opacity duration-500 rounded-[inherit]',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              background: `radial-gradient(600px circle at var(--glow-x, 50%) var(--glow-y, 50%), hsl(var(--primary) / 0.12), transparent 40%)`,
            }}
          />
        )}
        
        {/* Border glow */}
        {glow && (
          <div
            className={cn(
              'absolute inset-0 pointer-events-none transition-opacity duration-500 rounded-[inherit]',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              background: `radial-gradient(400px circle at var(--glow-x, 50%) var(--glow-y, 50%), hsl(var(--primary) / 0.25), transparent 40%)`,
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'xor',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />
        )}
        
        {children}
      </Card>
    );
  }
);

GlowCard.displayName = 'GlowCard';
