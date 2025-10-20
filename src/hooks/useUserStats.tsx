import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface UserStats {
  id: string;
  user_id: string;
  expenses_count: number;
  goals_completed: number;
  current_streak: number;
  longest_streak: number;
  total_points: number;
  updated_at: string;
}

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebratedMilestones, setCelebratedMilestones] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no stats exist, they will be created by the trigger when user was created
        console.log('No stats found, they should be created automatically');
        setStats(null);
      } else {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up real-time subscription for stats updates
    if (user) {
      const channel = supabase
        .channel('user_stats_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_stats',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new) {
              const newStats = payload.new as UserStats;
              const oldStats = stats;
              
              // Check for streak milestones (only once per milestone)
              if (oldStats && newStats.current_streak > oldStats.current_streak) {
                const streak = newStats.current_streak;
                const milestoneKey = `streak_${streak}`;
                
                if (!celebratedMilestones.has(milestoneKey)) {
                  if (streak === 3) {
                    setCelebratedMilestones(prev => new Set(prev).add(milestoneKey));
                    toast({
                      title: "🔥 3-Day Streak!",
                      description: "You're building momentum!",
                      duration: 3000,
                    });
                  } else if (streak === 7) {
                    setCelebratedMilestones(prev => new Set(prev).add(milestoneKey));
                    toast({
                      title: "🌟 7-Day Streak!",
                      description: "One week of consistent tracking!",
                      duration: 4000,
                    });
                  } else if (streak === 14) {
                    setCelebratedMilestones(prev => new Set(prev).add(milestoneKey));
                    toast({
                      title: "💎 2-Week Streak!",
                      description: "You're unstoppable!",
                      duration: 4000,
                    });
                  }
                }
              }
              
              // Check for goals completed milestone (only once per milestone)
              if (oldStats && newStats.goals_completed > oldStats.goals_completed) {
                const goalsCompleted = newStats.goals_completed;
                const milestoneKey = `goal_${goalsCompleted}`;
                
                if (!celebratedMilestones.has(milestoneKey)) {
                  if (goalsCompleted === 1) {
                    setCelebratedMilestones(prev => new Set(prev).add(milestoneKey));
                    toast({
                      title: "🎯 First Goal Completed!",
                      description: "This is just the beginning!",
                      duration: 4000,
                    });
                  } else if (goalsCompleted === 5) {
                    setCelebratedMilestones(prev => new Set(prev).add(milestoneKey));
                    toast({
                      title: "🌟 5 Goals Completed!",
                      description: "You're making great progress!",
                      duration: 4000,
                    });
                  }
                }
              }
              
              setStats(newStats);
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
    stats,
    loading,
    refetch: fetchStats,
  };
};