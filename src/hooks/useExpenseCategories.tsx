import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface ExpenseCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  created_at: string;
}

export const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", icon: "🍽️" },
  { name: "Transportation", icon: "🚗" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Healthcare", icon: "🏥" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Utilities", icon: "⚡" },
  { name: "Education", icon: "📚" },
  { name: "Travel", icon: "✈️" },
  { name: "Investment", icon: "💰" },
  { name: "Other", icon: "📝" }
];

export const useExpenseCategories = () => {
  const [customCategories, setCustomCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCategories = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCustomCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load custom categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (name: string, icon: string = '📝') => {
    if (!user) return { success: false };

    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert([{ 
          user_id: user.id, 
          name: name.trim(),
          icon 
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Category exists",
            description: "You already have a category with this name",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return { success: false };
      }

      setCustomCategories(prev => [...prev, data]);
      toast({
        title: "Category added",
        description: `"${name}" is now available`,
      });
      return { success: true, data };
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCustomCategories(prev => prev.filter(cat => cat.id !== id));
      toast({
        title: "Category deleted",
        description: "Category has been removed",
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const getAllCategories = () => {
    const defaultCats = DEFAULT_CATEGORIES.map(cat => ({
      ...cat,
      isDefault: true
    }));
    const customCats = customCategories.map(cat => ({
      ...cat,
      isDefault: false
    }));
    return [...defaultCats, ...customCats];
  };

  useEffect(() => {
    fetchCategories();

    if (user) {
      const channel = supabase
        .channel('expense_categories_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'expense_categories',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchCategories();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    customCategories,
    loading,
    addCategory,
    deleteCategory,
    getAllCategories,
    refetch: fetchCategories,
  };
};