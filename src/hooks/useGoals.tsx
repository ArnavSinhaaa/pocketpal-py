import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Goal {
  id: string;
  title: string;
  category?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  created_at: string;
  updated_at: string;
}

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to load goals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goalData: {
    title: string;
    category?: string;
    target_amount: number;
    target_date?: string;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('financial_goals')
        .insert({
          user_id: user.id,
          title: goalData.title,
          category: goalData.category,
          target_amount: goalData.target_amount,
          target_date: goalData.target_date,
          current_amount: 0
        })
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [data, ...prev]);
      toast({
        title: "Goal Created",
        description: `"${goalData.title}" goal has been added successfully.`,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error adding goal:', error);
      toast({
        title: "Error",
        description: "Failed to add goal. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const oldGoal = goals.find(g => g.id === id);
      
      const { data, error } = await supabase
        .from('financial_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => prev.map(goal => goal.id === id ? data : goal));
      
      // Calculate progress percentages
      const oldProgress = oldGoal ? (oldGoal.current_amount / oldGoal.target_amount) * 100 : 0;
      const newProgress = (data.current_amount / data.target_amount) * 100;
      
      // Check if goal was completed
      if (updates.current_amount && data.current_amount >= data.target_amount && oldProgress < 100) {
        // Trigger confetti
        const confetti = (window as any).confetti;
        if (confetti) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
        
        toast({
          title: "🎉 Goal Completed!",
          description: `Congratulations! You've reached your "${data.title}" goal of ₹${data.target_amount.toLocaleString()}!`,
          duration: 5000,
        });
      } 
      // Check for milestone notifications (75%, 90%)
      else if (updates.current_amount) {
        if (oldProgress < 75 && newProgress >= 75) {
          toast({
            title: "🌟 75% Complete!",
            description: `You're almost there! Only ₹${(data.target_amount - data.current_amount).toLocaleString()} left for "${data.title}"`,
            duration: 4000,
          });
        } else if (oldProgress < 90 && newProgress >= 90) {
          toast({
            title: "🔥 90% Complete!",
            description: `So close! Just ₹${(data.target_amount - data.current_amount).toLocaleString()} more to reach "${data.title}"`,
            duration: 4000,
          });
        } else if (oldProgress < 50 && newProgress >= 50) {
          toast({
            title: "🎯 Halfway There!",
            description: `Great progress on "${data.title}"! Keep it up!`,
            duration: 3000,
          });
        } else {
          toast({
            title: "💰 Progress Updated",
            description: `+₹${(data.current_amount - oldGoal!.current_amount).toLocaleString()} added to "${data.title}"`,
          });
        }
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGoals(prev => prev.filter(goal => goal.id !== id));
      toast({
        title: "Goal Removed",
        description: "Goal has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error removing goal:', error);
      toast({
        title: "Error",
        description: "Failed to remove goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    removeGoal,
    refetch: fetchGoals,
  };
};