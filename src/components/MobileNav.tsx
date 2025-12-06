import { motion } from 'framer-motion';
import { TrendingUp, Target, Bell, Trophy, Lightbulb } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'expenses', icon: TrendingUp, label: 'Expenses' },
  { id: 'insights', icon: Lightbulb, label: 'Insights' },
  { id: 'goals', icon: Target, label: 'Goals' },
  { id: 'bills', icon: Bell, label: 'Bills' },
  { id: 'achievements', icon: Trophy, label: 'Rewards' },
];

/**
 * Mobile-optimized bottom navigation bar
 * Features:
 * - Fixed bottom position with safe area support
 * - Haptic-like tap feedback
 * - Active indicator animation
 * - Gesture-friendly touch targets (44px minimum)
 */
export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center w-full h-full touch-target haptic-tap"
              whileTap={{ scale: 0.9 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 top-1 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Icon 
                  className={`h-5 w-5 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`} 
                />
              </motion.div>
              
              <span 
                className={`text-[10px] mt-1 font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Floating action button for mobile
 * Used for primary actions like adding expenses
 */
interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
}

export function FloatingActionButton({ onClick, icon, label }: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 md:hidden h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center touch-target"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      aria-label={label}
    >
      {icon}
      
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary-foreground/20"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </motion.button>
  );
}
