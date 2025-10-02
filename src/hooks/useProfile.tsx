import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  annual_salary: number;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSalary = async (salary: number) => {
    if (!user) return { success: false };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ annual_salary: salary })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      toast({
        title: "💰 Salary Updated",
        description: `Annual salary set to ₹${salary.toLocaleString()}`,
      });
      
      return { success: true, data };
    } catch (error) {
      console.error('Error updating salary:', error);
      toast({
        title: "Error",
        description: "Failed to save salary. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchProfile();

    // Real-time subscription
    if (user) {
      const channel = supabase
        .channel('profile_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new) {
              setProfile(payload.new as Profile);
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
    profile,
    loading,
    updateSalary,
    refetch: fetchProfile,
  };
};
