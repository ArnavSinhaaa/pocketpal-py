/**
 * ========================================
 * USE PROFILE HOOK - User Profile Management
 * ========================================
 * 
 * Manages user profile data, particularly annual salary information.
 * Includes real-time updates when profile changes.
 * 
 * USAGE:
 * const { profile, updateSalary, loading } = useProfile();
 * 
 * CODING TIP: Separate concerns! This hook ONLY handles profile data.
 * Expenses have their own hook, goals have their own hook, etc.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Profile data structure
 * 
 * EDIT THIS if you add new profile fields (avatar, bio, etc.)
 */
export interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  annual_salary: number;
  created_at: string;
  updated_at: string;
}

/**
 * Main useProfile hook
 * 
 * @returns Profile data, loading state, and update methods
 * 
 * ARCHITECTURE: Similar to useExpenses but focused on profile data
 */
export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  /**
   * Fetch user profile from database
   * 
   * NOTE: Profile is created automatically when user signs up (via trigger)
   * See: supabase/migrations for the handle_new_user() function
   */
  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single(); // Expect exactly one row

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't show toast here - profile might not exist yet
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user's annual salary
   * 
   * @param salary - New annual salary amount
   * @returns Success/error object
   * 
   * CODING TIP: Validate input before sending to database!
   * Add salary range checks here (e.g., must be positive, reasonable max)
   */
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

      // Update local state immediately
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

  /**
   * Effect: Initial fetch and real-time subscription
   * 
   * CODING TIP: Real-time subscriptions keep your UI in sync automatically!
   * Great for multi-device scenarios or collaborative features.
   */
  useEffect(() => {
    fetchProfile();

    // Real-time subscription for profile changes
    if (user) {
      const channel = supabase
        .channel('profile_changes')
        .on(
          'postgres_changes',
          {
            event: '*',                    // All events
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}` // Only this user's profile
          },
          (payload) => {
            if (payload.new) {
              setProfile(payload.new as Profile);
            }
          }
        )
        .subscribe();

      // Cleanup on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  /**
   * Return public API
   * 
   * TODO: Add more profile update methods as needed:
   * - updateDisplayName(name: string)
   * - updateAvatar(url: string)
   * - updatePreferences(prefs: object)
   */
  return {
    profile,
    loading,
    updateSalary,
    refetch: fetchProfile,
  };
};