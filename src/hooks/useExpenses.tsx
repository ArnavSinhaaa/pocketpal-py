/**
 * ========================================
 * USE EXPENSES HOOK - Expense Data Management
 * ========================================
 * 
 * Custom hook for managing expense data with real-time updates.
 * Handles CRUD operations and gamification (milestones, confetti).
 * 
 * USAGE:
 * const { expenses, addExpense, removeExpense, loading } = useExpenses();
 * 
 * CODING TIP: Custom hooks are perfect for encapsulating complex logic that
 * multiple components need. Keep your components clean by moving data logic here!
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Expense data structure
 * 
 * CODING TIP: Always define TypeScript interfaces for your data.
 * This prevents bugs and gives you autocomplete!
 */
export interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;  // Optional field
  date: string;
  created_at: string;
}

/**
 * Main useExpenses hook
 * 
 * @returns Expense data, loading state, and CRUD methods
 * 
 * ARCHITECTURE NOTE: This hook combines:
 * 1. Local state management (useState)
 * 2. Server communication (Supabase)
 * 3. Real-time updates (Supabase subscriptions)
 * 4. User feedback (toasts)
 * 5. Gamification (milestone celebrations)
 */
export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  /**
   * Fetch all expenses for the current user from Supabase
   * 
   * CODING TIP: Always check if user exists before making authenticated requests.
   * This prevents errors when the component mounts before auth is ready.
   */
  const fetchExpenses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)          // Only get current user's expenses
        .order('date', { ascending: false }); // Newest first

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new expense to the database
   * 
   * @param expenseData - Expense information (category, amount, etc.)
   * @returns Success/error object
   * 
   * FEATURES:
   * - Immediate UI update (optimistic)
   * - Milestone detection (5, 10, 25, 50, 100+ expenses)
   * - Confetti celebration at major milestones
   * - Toast notifications
   * 
   * CODING TIP: Return success/error objects instead of throwing errors.
   * This gives the caller control over error handling.
   */
  const addExpense = async (expenseData: {
    category: string;
    amount: number;
    description?: string;
    date?: string;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          category: expenseData.category,
          amount: expenseData.amount,
          description: expenseData.description,
          date: expenseData.date || new Date().toISOString().split('T')[0], // Default to today
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state immediately (optimistic update)
      setExpenses(prev => {
        const newExpenses = [data, ...prev];
        const count = newExpenses.length;
        
        /**
         * Gamification: Check for milestones
         * 
         * CODING TIP: Use setTimeout for celebration toasts so they don't
         * interfere with the success toast. Delays create better UX!
         */
        if (count === 5) {
          setTimeout(() => {
            toast({
              title: "🎉 5 Expenses Tracked!",
              description: "You're building a great tracking habit!",
              duration: 4000,
            });
          }, 500);
        } else if (count === 10) {
          setTimeout(() => {
            toast({
              title: "🔥 10 Expenses Tracked!",
              description: "Amazing consistency! Keep it up!",
              duration: 4000,
            });
          }, 500);
        } else if (count === 25) {
          setTimeout(() => {
            toast({
              title: "⭐ 25 Expenses Tracked!",
              description: "You're a budgeting superstar!",
              duration: 4000,
            });
          }, 500);
        } else if (count === 50) {
          // Major milestone: Add confetti!
          setTimeout(() => {
            const confetti = (window as any).confetti;
            if (confetti) {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
              });
            }
            toast({
              title: "🏆 50 Expenses Tracked!",
              description: "Incredible milestone! You're a financial tracking champion!",
              duration: 5000,
            });
          }, 500);
        } else if (count % 100 === 0 && count > 0) {
          // Every 100 expenses: Even bigger celebration!
          setTimeout(() => {
            const confetti = (window as any).confetti;
            if (confetti) {
              confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 }
              });
            }
            toast({
              title: `🎊 ${count} Expenses!`,
              description: "You're a true financial master!",
              duration: 5000,
            });
          }, 500);
        }
        
        return newExpenses;
      });
      
      // Success toast
      toast({
        title: "✅ Expense Added",
        description: `₹${expenseData.amount.toLocaleString()} added to ${expenseData.category}`,
      });
      
      return { success: true, data };
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "❌ Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  /**
   * Remove an expense from the database
   * 
   * @param id - Expense ID to delete
   * 
   * CODING TIP: Implement soft deletes for production apps!
   * Instead of deleting, add a 'deleted_at' field. This allows undo functionality.
   */
  const removeExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      
      toast({
        title: "Expense Removed",
        description: "Expense has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error removing expense:', error);
      toast({
        title: "Error",
        description: "Failed to remove expense. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Effect: Initial data fetch and real-time subscription setup
   * 
   * CODING TIP: Real-time subscriptions are powerful! They keep your UI in sync
   * automatically when data changes (even from other devices/tabs).
   */
  useEffect(() => {
    fetchExpenses();

    // Set up real-time subscription for expenses
    if (user) {
      const channel = supabase
        .channel('expenses_changes')
        .on(
          'postgres_changes',
          {
            event: '*',                  // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'expenses',
            filter: `user_id=eq.${user.id}` // Only current user's data
          },
          (payload) => {
            // Handle INSERT events
            if (payload.eventType === 'INSERT' && payload.new) {
              setExpenses(prev => {
                // Check if expense already exists (prevent duplicates)
                const exists = prev.some(e => e.id === payload.new.id);
                if (!exists) {
                  return [payload.new as Expense, ...prev];
                }
                return prev;
              });
            } 
            // Handle DELETE events
            else if (payload.eventType === 'DELETE' && payload.old) {
              setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
            }
            // Add UPDATE handling here if needed
          }
        )
        .subscribe();

      // Cleanup: Unsubscribe when component unmounts or user changes
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]); // Re-run when user changes

  /**
   * Return public API
   * 
   * CODING TIP: Only expose what components need. Keep internal helper
   * functions private to the hook.
   */
  return {
    expenses,         // Array of expense objects
    loading,          // Boolean: true while fetching
    addExpense,       // Function to add expense
    removeExpense,    // Function to delete expense
    refetch: fetchExpenses, // Function to manually reload data
  };
};