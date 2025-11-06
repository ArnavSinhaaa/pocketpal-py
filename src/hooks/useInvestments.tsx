import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Investment {
  id: string;
  user_id: string;
  investment_type: string;
  name: string;
  purchase_date: string;
  purchase_price: number;
  quantity: number;
  current_price?: number;
  current_value?: number;
  category?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useInvestments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInvestments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      console.error('Error fetching investments:', error);
      toast({
        title: "Error",
        description: "Failed to load investments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addInvestment = async (investment: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('investments')
        .insert([{ ...investment, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setInvestments(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Investment added successfully",
      });
    } catch (error) {
      console.error('Error adding investment:', error);
      toast({
        title: "Error",
        description: "Failed to add investment",
        variant: "destructive",
      });
    }
  };

  const updateInvestment = async (id: string, updates: Partial<Investment>) => {
    try {
      const { error } = await supabase
        .from('investments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setInvestments(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
      toast({
        title: "Success",
        description: "Investment updated successfully",
      });
    } catch (error) {
      console.error('Error updating investment:', error);
      toast({
        title: "Error",
        description: "Failed to update investment",
        variant: "destructive",
      });
    }
  };

  const deleteInvestment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInvestments(prev => prev.filter(inv => inv.id !== id));
      toast({
        title: "Success",
        description: "Investment deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting investment:', error);
      toast({
        title: "Error",
        description: "Failed to delete investment",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchInvestments();

    const channel = supabase
      .channel('investments_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'investments', filter: `user_id=eq.${user?.id}` },
        () => {
          fetchInvestments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    investments,
    loading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    refetch: fetchInvestments,
  };
};