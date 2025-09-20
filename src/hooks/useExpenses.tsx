import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchExpenses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

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
          date: expenseData.date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;

      // Update expenses state immediately
      setExpenses(prev => [data, ...prev]);
      
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

  const removeExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

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

  useEffect(() => {
    fetchExpenses();

    // Set up real-time subscription for expenses
    if (user) {
      const channel = supabase
        .channel('expenses_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'expenses',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              setExpenses(prev => {
                const exists = prev.some(e => e.id === payload.new.id);
                if (!exists) {
                  return [payload.new as Expense, ...prev];
                }
                return prev;
              });
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
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
    expenses,
    loading,
    addExpense,
    removeExpense,
    refetch: fetchExpenses,
  };
};