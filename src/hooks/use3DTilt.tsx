import { useRef, useState, useEffect } from 'react';

interface TiltOptions {
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
}

export const use3DTilt = (options: TiltOptions = {}) => {
  const {
    maxTilt = 15,
    perspective = 1000,
    scale = 1.05,
    speed = 400,
    glare = true,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      element.style.transform = `
        perspective(${perspective}px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale3d(${scale}, ${scale}, ${scale})
      `;

      if (glare) {
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        element.style.setProperty('--glare-x', `${glareX}%`);
        element.style.setProperty('--glare-y', `${glareY}%`);
      }
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
      if (element) {
        element.style.transition = 'none';
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      if (element) {
        element.style.transition = `transform ${speed}ms ease-out`;
        element.style.transform = `
          perspective(${perspective}px)
          rotateX(0deg)
          rotateY(0deg)
          scale3d(1, 1, 1)
        `;
      }
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxTilt, perspective, scale, speed, glare]);

  return { ref, isHovered };
};
