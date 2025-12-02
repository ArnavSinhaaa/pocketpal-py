import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  shape: 'circle' | 'square' | 'triangle' | 'ring';
  rotation: number;
  delay: number;
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 25,
  className,
}) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 8,
      opacity: Math.random() * 0.3 + 0.1,
      speed: Math.random() * 0.5 + 0.1,
      shape: (['circle', 'square', 'triangle', 'ring'] as const)[Math.floor(Math.random() * 4)],
      rotation: Math.random() * 360,
      delay: Math.random() * 5,
    }));
  }, [count]);

  const renderShape = (particle: Particle) => {
    const baseClasses = 'transition-all duration-1000';
    
    switch (particle.shape) {
      case 'circle':
        return (
          <div
            className={cn(baseClasses, 'rounded-full bg-primary/20')}
            style={{
              width: particle.size,
              height: particle.size,
            }}
          />
        );
      case 'square':
        return (
          <div
            className={cn(baseClasses, 'rounded-sm bg-accent/15')}
            style={{
              width: particle.size,
              height: particle.size,
              transform: `rotate(${particle.rotation + scrollY * particle.speed * 0.1}deg)`,
            }}
          />
        );
      case 'triangle':
        return (
          <div
            className={baseClasses}
            style={{
              width: 0,
              height: 0,
              borderLeft: `${particle.size / 2}px solid transparent`,
              borderRight: `${particle.size / 2}px solid transparent`,
              borderBottom: `${particle.size}px solid hsl(var(--primary) / 0.15)`,
              transform: `rotate(${particle.rotation + scrollY * particle.speed * 0.05}deg)`,
            }}
          />
        );
      case 'ring':
        return (
          <div
            className={cn(baseClasses, 'rounded-full border-2 border-primary/20')}
            style={{
              width: particle.size,
              height: particle.size,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('fixed inset-0 pointer-events-none overflow-hidden z-0', className)}>
      {particles.map((particle) => {
        const parallaxY = scrollY * particle.speed * 0.3;
        const floatOffset = Math.sin((scrollY * 0.01 + particle.delay) * particle.speed) * 20;
        
        return (
          <div
            key={particle.id}
            className="absolute transition-transform duration-300 ease-out"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.opacity,
              transform: `translateY(${-parallaxY + floatOffset}px)`,
              animation: `float-particle ${8 + particle.delay}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          >
            {renderShape(particle)}
          </div>
        );
      })}
      
      {/* Gradient orbs for extra depth */}
      <div 
        className="absolute w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)',
          left: '10%',
          top: '20%',
          transform: `translateY(${-scrollY * 0.1}px)`,
        }}
      />
      <div 
        className="absolute w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent) / 0.3), transparent 70%)',
          right: '15%',
          top: '60%',
          transform: `translateY(${-scrollY * 0.15}px)`,
        }}
      />
      <div 
        className="absolute w-64 h-64 rounded-full opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(var(--chart-2) / 0.2), transparent 70%)',
          left: '50%',
          top: '80%',
          transform: `translateY(${-scrollY * 0.08}px)`,
        }}
      />
    </div>
  );
};
