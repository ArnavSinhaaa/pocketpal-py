import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ParallaxSectionProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // 0.1 to 0.5 recommended
  fadeIn?: boolean;
  scaleOnScroll?: boolean;
  delay?: number;
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  className,
  speed = 0.15,
  fadeIn = true,
  scaleOnScroll = false,
  delay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);
  const [scale, setScale] = useState(scaleOnScroll ? 0.95 : 1);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const distanceFromCenter = elementCenter - windowHeight / 2;
      
      // Parallax effect
      const parallaxOffset = distanceFromCenter * speed;
      setParallaxY(parallaxOffset);

      // Scale effect based on visibility
      if (scaleOnScroll) {
        const visibilityRatio = 1 - Math.abs(distanceFromCenter) / windowHeight;
        const newScale = 0.95 + (visibilityRatio * 0.05);
        setScale(Math.max(0.95, Math.min(1, newScale)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, scaleOnScroll]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        fadeIn && !isVisible && 'opacity-0 translate-y-8',
        fadeIn && isVisible && 'opacity-100 translate-y-0',
        className
      )}
      style={{
        transform: `translateY(${parallaxY}px) scale(${scale})`,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
};

// Floating effect component for headers
export const FloatingHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY * 0.1);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={cn('transition-transform duration-100', className)}
      style={{ transform: `translateY(${offsetY}px)` }}
    >
      {children}
    </div>
  );
};

// Scroll progress indicator
export const ScrollProgressBar: React.FC<{ className?: string }> = ({ className }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / scrollHeight) * 100;
      setProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={cn('fixed top-0 left-0 right-0 h-1 z-50 bg-muted', className)}>
      <div
        className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
