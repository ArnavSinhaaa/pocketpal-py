import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface IndirectIncomeSource {
  id: string;
  user_id: string;
  income_type: string;
  amount: number;
  frequency: string;
  created_at: string;
  updated_at: string;
}

export const useIndirectIncome = () => {
  const [sources, setSources] = useState<IndirectIncomeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSources = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('indirect_income_sources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error fetching indirect income sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSource = async (source: Omit<IndirectIncomeSource, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { success: false };

    try {
      const { data, error } = await supabase
        .from('indirect_income_sources')
        .insert([{ ...source, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setSources((prev) => [data, ...prev]);
      toast({
        title: "✅ Income Source Added",
        description: `${source.income_type} added successfully`,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error adding source:', error);
      toast({
        title: "Error",
        description: "Failed to add income source. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updateSource = async (id: string, updates: Partial<IndirectIncomeSource>) => {
    if (!user) return { success: false };

    try {
      const { data, error } = await supabase
        .from('indirect_income_sources')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSources((prev) => prev.map((s) => (s.id === id ? data : s)));
      toast({
        title: "✅ Updated",
        description: "Income source updated successfully",
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error updating source:', error);
      toast({
        title: "Error",
        description: "Failed to update income source.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const deleteSource = async (id: string) => {
    if (!user) return { success: false };

    try {
      const { error } = await supabase
        .from('indirect_income_sources')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSources((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: "🗑️ Deleted",
        description: "Income source removed successfully",
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting source:', error);
      toast({
        title: "Error",
        description: "Failed to delete income source.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchSources();

    if (user) {
      const channel = supabase
        .channel('indirect_income_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'indirect_income_sources',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchSources();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    sources,
    loading,
    addSource,
    updateSource,
    deleteSource,
    refetch: fetchSources,
  };
};