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

    // Check if already earned
    const alreadyEarned = achievements.some(a => a.achievement_type === achievementType);
    if (alreadyEarned) return;

    try {
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

      if (error) throw error;

      // Update achievements state
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
            total_points: currentStats.total_points + points
          })
          .eq('user_id', user.id);
      }

      // Show celebration toast
      toast({
        title: "🎉 Achievement Unlocked!",
        description: `${title} - You earned ${points} points!`,
      });

    } catch (error) {
      console.error('Error awarding achievement:', error);
    }
  };

  const checkAndAwardAchievements = useCallback(async (stats: UserStats) => {
    if (!stats) return;

    const achievementChecks = [
      // Expense tracking achievements
      {
        type: 'first_expense',
        condition: stats.expenses_count >= 1,
        title: 'First Step',
        description: 'Added your first expense',
        points: 10
      },
      {
        type: 'expense_tracker',
        condition: stats.expenses_count >= 10,
        title: 'Expense Tracker',
        description: 'Tracked 10 expenses',
        points: 25
      },
      {
        type: 'expense_master',
        condition: stats.expenses_count >= 50,
        title: 'Expense Master',
        description: 'Tracked 50 expenses',
        points: 100
      },
      // Goal achievements
      {
        type: 'goal_setter',
        condition: stats.goals_completed >= 1,
        title: 'Goal Setter',
        description: 'Completed your first financial goal',
        points: 50
      },
      // Streak achievements
      {
        type: 'streak_beginner',
        condition: stats.current_streak >= 3,
        title: 'Getting Started',
        description: 'Maintained a 3-day streak',
        points: 15
      },
      {
        type: 'streak_champion',
        condition: stats.current_streak >= 7,
        title: 'Consistency Champion',
        description: 'Maintained a 7-day streak',
        points: 75
      }
    ];

    for (const check of achievementChecks) {
      if (check.condition) {
        await awardAchievement(check.type, check.title, check.description, check.points);
      }
    }
  }, [achievements, user]);

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  return {
    achievements,
    loading,
    checkAndAwardAchievements,
    refetch: fetchAchievements,
  };
};