import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  title: string;
  description?: string;
  achievement_type: string;
  points: number;
  earned_at: string;
}

export interface UserStats {
  expenses_count: number;
  goals_completed: number;
  current_streak: number;
  longest_streak: number;
  total_points: number;
}

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const awardAchievement = async (achievementType: string, title: string, description: string, points: number) => {
    if (!user) return;

    try {
      // Check database directly for existing achievement to avoid duplicates
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('achievement_type', achievementType)
        .single();

      // If achievement already exists, skip
      if (existing) return;

      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_type: achievementType,
          title,
          description,
          points
        })
        .select()
        .single();

      if (error) {
        // If error is due to duplicate, silently ignore
        if (error.code === '23505') return;
        throw error;
      }

      // Update achievements state immediately
      setAchievements(prev => [data, ...prev]);

      // Update user stats total points
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('total_points')
        .eq('user_id', user.id)
        .single();

      if (currentStats) {
        await supabase
          .from('user_stats')
          .update({ 
            total_points: (currentStats.total_points || 0) + points
          })
          .eq('user_id', user.id);
      }

      // Show celebration notification with confetti only for major achievements
      const isMajorAchievement = points >= 100;
      
      if (isMajorAchievement) {
        const confetti = (window as any).confetti;
        if (confetti) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
      
      toast({
        title: `🏆 Achievement Unlocked!`,
        description: `"${title}" - +${points} points`,
        duration: 5000,
      });

    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  };

  const checkAndAwardAchievements = useCallback(async (stats: UserStats) => {
    if (!stats || isChecking) return;
    
    setIsChecking(true);

    const achievementChecks = [
      // Expense tracking achievements
      {
        type: 'first_expense',
        condition: stats.expenses_count >= 1,
        title: '🎯 First Step',
        description: 'Added your first expense',
        points: 10
      },
      {
        type: 'expense_tracker_5',
        condition: stats.expenses_count >= 5,
        title: '📊 Getting Organized',
        description: 'Tracked 5 expenses',
        points: 20
      },
      {
        type: 'expense_tracker',
        condition: stats.expenses_count >= 10,
        title: '💼 Expense Tracker',
        description: 'Tracked 10 expenses',
        points: 25
      },
      {
        type: 'expense_tracker_25',
        condition: stats.expenses_count >= 25,
        title: '⭐ Budget Pro',
        description: 'Tracked 25 expenses',
        points: 50
      },
      {
        type: 'expense_master',
        condition: stats.expenses_count >= 50,
        title: '🏅 Expense Master',
        description: 'Tracked 50 expenses',
        points: 100
      },
      {
        type: 'expense_legend',
        condition: stats.expenses_count >= 100,
        title: '👑 Expense Legend',
        description: 'Tracked 100 expenses',
        points: 250
      },
      {
        type: 'expense_champion',
        condition: stats.expenses_count >= 250,
        title: '💎 Financial Champion',
        description: 'Tracked 250 expenses',
        points: 500
      },
      {
        type: 'expense_master_500',
        condition: stats.expenses_count >= 500,
        title: '🌟 Master Budgeter',
        description: 'Tracked 500 expenses',
        points: 1000
      },
      // Goal achievements
      {
        type: 'goal_setter',
        condition: stats.goals_completed >= 1,
        title: '🎯 Goal Setter',
        description: 'Completed your first financial goal',
        points: 50
      },
      {
        type: 'goal_achiever_3',
        condition: stats.goals_completed >= 3,
        title: '🌱 Goal Achiever',
        description: 'Completed 3 financial goals',
        points: 100
      },
      {
        type: 'goal_achiever',
        condition: stats.goals_completed >= 5,
        title: '🚀 Goal Master',
        description: 'Completed 5 financial goals',
        points: 150
      },
      {
        type: 'goal_champion',
        condition: stats.goals_completed >= 10,
        title: '💪 Goal Champion',
        description: 'Completed 10 financial goals',
        points: 300
      },
      {
        type: 'goal_legend',
        condition: stats.goals_completed >= 20,
        title: '🏆 Goal Legend',
        description: 'Completed 20 financial goals',
        points: 750
      },
      // Streak achievements
      {
        type: 'streak_beginner',
        condition: stats.current_streak >= 3,
        title: '🔥 Getting Started',
        description: 'Maintained a 3-day streak',
        points: 15
      },
      {
        type: 'streak_5',
        condition: stats.current_streak >= 5,
        title: '⚡ On Fire',
        description: 'Maintained a 5-day streak',
        points: 30
      },
      {
        type: 'streak_champion',
        condition: stats.current_streak >= 7,
        title: '🌟 Consistency Champion',
        description: 'Maintained a 7-day streak',
        points: 75
      },
      {
        type: 'streak_14',
        condition: stats.current_streak >= 14,
        title: '💎 Two-Week Warrior',
        description: 'Maintained a 14-day streak',
        points: 150
      },
      {
        type: 'streak_30',
        condition: stats.current_streak >= 30,
        title: '👑 Monthly Master',
        description: 'Maintained a 30-day streak',
        points: 300
      },
      {
        type: 'streak_legend',
        condition: stats.current_streak >= 60,
        title: '🌈 Streak Legend',
        description: 'Maintained a 60-day streak',
        points: 750
      },
      {
        type: 'streak_100',
        condition: stats.current_streak >= 100,
        title: '🎊 Centurion',
        description: 'Maintained a 100-day streak',
        points: 1500
      },
      // Points milestones
      {
        type: 'points_500',
        condition: stats.total_points >= 500,
        title: '💰 Point Collector',
        description: 'Earned 500 points',
        points: 50
      },
      {
        type: 'points_1000',
        condition: stats.total_points >= 1000,
        title: '💎 Point Master',
        description: 'Earned 1000 points',
        points: 100
      },
      {
        type: 'points_2500',
        condition: stats.total_points >= 2500,
        title: '🏆 Elite Member',
        description: 'Earned 2500 points',
        points: 250
      },
      {
        type: 'points_5000',
        condition: stats.total_points >= 5000,
        title: '👑 VIP Legend',
        description: 'Earned 5000 points',
        points: 500
      },
      {
        type: 'points_10000',
        condition: stats.total_points >= 10000,
        title: '💫 Ultimate Champion',
        description: 'Earned 10000 points',
        points: 1000
      },
      // Additional streak milestones
      {
        type: 'streak_150',
        condition: stats.current_streak >= 150,
        title: '🔥 Streak Master',
        description: 'Maintained a 150-day streak',
        points: 2500
      },
      {
        type: 'streak_200',
        condition: stats.current_streak >= 200,
        title: '⚡ Unstoppable Force',
        description: 'Maintained a 200-day streak',
        points: 3500
      },
      {
        type: 'streak_365',
        condition: stats.current_streak >= 365,
        title: '🌟 Year-Long Warrior',
        description: 'Maintained a full year streak!',
        points: 5000
      },
      // Additional expense tracking milestones
      {
        type: 'expense_1000',
        condition: stats.expenses_count >= 1000,
        title: '🏆 Tracking Titan',
        description: 'Tracked 1000 expenses',
        points: 2000
      },
      {
        type: 'expense_2500',
        condition: stats.expenses_count >= 2500,
        title: '💎 Financial Guru',
        description: 'Tracked 2500 expenses',
        points: 5000
      },
      // Additional goal achievements
      {
        type: 'goal_achiever_30',
        condition: stats.goals_completed >= 30,
        title: '🎯 Goal Master Supreme',
        description: 'Completed 30 financial goals',
        points: 1500
      },
      {
        type: 'goal_achiever_50',
        condition: stats.goals_completed >= 50,
        title: '🌟 Dream Achiever',
        description: 'Completed 50 financial goals',
        points: 3000
      },
      {
        type: 'goal_achiever_100',
        condition: stats.goals_completed >= 100,
        title: '👑 Goal Legend',
        description: 'Completed 100 financial goals',
        points: 7500
      }
    ];

    for (const check of achievementChecks) {
      if (check.condition) {
        await awardAchievement(check.type, check.title, check.description, check.points);
      }
    }
    
    setIsChecking(false);
  }, [achievements, user, isChecking]);

  useEffect(() => {
    fetchAchievements();

    // Set up real-time subscription for achievements
    if (user) {
      const channel = supabase
        .channel('user_achievements_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_achievements',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              setAchievements(prev => {
                const exists = prev.some(a => a.id === payload.new.id);
                if (!exists) {
                  return [payload.new as Achievement, ...prev];
                }
                return prev;
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    achievements,
    loading,
    checkAndAwardAchievements,
    refetch: fetchAchievements,
  };
};