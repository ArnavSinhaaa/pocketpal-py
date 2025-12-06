import { useEffect, useCallback } from 'react';

interface SmoothScrollOptions {
  /** Enable/disable smooth scrolling */
  enabled?: boolean;
  /** Scroll speed multiplier (lower = smoother, 0.05-0.15 recommended) */
  smoothness?: number;
  /** Whether to use native smooth scroll on mobile */
  mobileNative?: boolean;
}

/**
 * Custom hook for enhanced smooth scrolling with momentum
 * Provides butter-smooth scrolling experience on desktop while
 * preserving native touch scrolling on mobile devices.
 */
export function useSmoothScroll({
  enabled = true,
  smoothness = 0.1,
  mobileNative = true,
}: SmoothScrollOptions = {}) {
  useEffect(() => {
    if (!enabled) return;

    // Detect touch device - use native scrolling on mobile
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice && mobileNative) return;

    let currentScroll = window.scrollY;
    let targetScroll = window.scrollY;
    let rafId: number | null = null;
    let isScrolling = false;

    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const smoothScroll = () => {
      currentScroll = lerp(currentScroll, targetScroll, smoothness);
      
      // Stop animation when close enough
      if (Math.abs(currentScroll - targetScroll) < 0.5) {
        currentScroll = targetScroll;
        window.scrollTo(0, currentScroll);
        isScrolling = false;
        rafId = null;
        return;
      }

      window.scrollTo(0, currentScroll);
      rafId = requestAnimationFrame(smoothScroll);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      targetScroll += e.deltaY;
      targetScroll = Math.max(0, Math.min(targetScroll, document.body.scrollHeight - window.innerHeight));

      if (!isScrolling) {
        isScrolling = true;
        rafId = requestAnimationFrame(smoothScroll);
      }
    };

    // Add passive: false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enabled, smoothness, mobileNative]);
}

/**
 * Hook for scroll-triggered animations
 */
export function useScrollAnimation(threshold = 0.1) {
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      threshold,
      rootMargin: '0px 0px -50px 0px',
    });

    const elements = document.querySelectorAll('[data-scroll-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [observerCallback, threshold]);
}

/**
 * Hook to detect scroll direction
 */
export function useScrollDirection() {
  const detectScrollDirection = useCallback(() => {
    let lastScrollY = window.scrollY;
    let direction: 'up' | 'down' = 'down';

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      direction = currentScrollY > lastScrollY ? 'down' : 'up';
      lastScrollY = currentScrollY;
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('scrolldirection', { detail: { direction } }));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return detectScrollDirection();
  }, [detectScrollDirection]);
}
