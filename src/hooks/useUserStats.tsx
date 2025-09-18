import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserStats {
  total_points: number;
  current_streak: number;
  longest_streak: number;
  expenses_count: number;
  goals_completed: number;
}

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setStats(data || {
        total_points: 0,
        current_streak: 0,
        longest_streak: 0,
        expenses_count: 0,
        goals_completed: 0,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  // Set up real-time subscription for stats updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setStats(payload.new as UserStats);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    stats,
    loading,
    refetch: fetchStats,
  };
};