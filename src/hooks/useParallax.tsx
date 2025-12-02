import { useEffect, useState, useCallback } from 'react';

interface ParallaxConfig {
  speed?: number; // 0.1 to 1 (lower = slower parallax)
  direction?: 'up' | 'down';
  offset?: number;
}

export const useParallax = (config: ParallaxConfig = {}) => {
  const { speed = 0.3, direction = 'up', offset = 0 } = config;
  const [scrollY, setScrollY] = useState(0);
  const [elementTop, setElementTop] = useState(0);

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const setRef = useCallback((element: HTMLElement | null) => {
    if (element) {
      const rect = element.getBoundingClientRect();
      setElementTop(rect.top + window.scrollY);
    }
  }, []);

  const relativeScroll = scrollY - elementTop + offset;
  const translateY = direction === 'up' 
    ? -relativeScroll * speed 
    : relativeScroll * speed;

  const opacity = Math.max(0, Math.min(1, 1 - Math.abs(relativeScroll) * 0.001));

  return {
    setRef,
    style: {
      transform: `translateY(${translateY}px)`,
      transition: 'transform 0.1s ease-out',
    },
    opacity,
    scrollProgress: relativeScroll,
  };
};

export const useScrollProgress = () => {
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

  return progress;
};
