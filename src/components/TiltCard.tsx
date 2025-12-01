import { forwardRef, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { use3DTilt } from '@/hooks/use3DTilt';
import { cn } from '@/lib/utils';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  maxTilt?: number;
  scale?: number;
  glare?: boolean;
  children: ReactNode;
}

export const TiltCard = forwardRef<HTMLDivElement, TiltCardProps>(
  ({ className, maxTilt = 8, scale = 1.02, glare = true, children, ...props }, externalRef) => {
    const { ref } = use3DTilt({ maxTilt, scale, glare });

    return (
      <Card
        ref={ref}
        className={cn(
          'relative overflow-hidden transition-shadow duration-300',
          className
        )}
        style={{
          transformStyle: 'preserve-3d',
        }}
        {...props}
      >
        {/* Glare effect */}
        {glare && (
          <div
            className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-20 transition-opacity duration-300"
            style={{
              background:
                'radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.3) 0%, transparent 50%)',
            }}
          />
        )}
        <div style={{ transform: 'translateZ(20px)' }}>{children}</div>
      </Card>
    );
  }
);

TiltCard.displayName = 'TiltCard';
