import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Bill {
  id: string;
  title: string;
  amount: number;
  frequency: string;
  due_date: string;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export const useBills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBills = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bill_reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Error",
        description: "Failed to load bills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addBill = async (billData: {
    title: string;
    amount: number;
    frequency: string;
    due_date: string;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bill_reminders')
        .insert({
          user_id: user.id,
          title: billData.title,
          amount: billData.amount,
          frequency: billData.frequency,
          due_date: billData.due_date,
          is_paid: false
        })
        .select()
        .single();

      if (error) throw error;

      setBills(prev => [...prev, data].sort((a, b) => 
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      ));
      
      toast({
        title: "Bill Added",
        description: `"${billData.title}" reminder has been created.`,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error adding bill:', error);
      toast({
        title: "Error",
        description: "Failed to add bill. Please try again.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('bill_reminders')
        .update({ is_paid: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBills(prev => prev.map(bill => bill.id === id ? data : bill));
      toast({
        title: "Bill Marked as Paid",
        description: "Great! Bill has been marked as paid.",
      });
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      toast({
        title: "Error",
        description: "Failed to update bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeBill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bill_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBills(prev => prev.filter(bill => bill.id !== id));
      toast({
        title: "Bill Removed",
        description: "Bill reminder has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error removing bill:', error);
      toast({
        title: "Error",
        description: "Failed to remove bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBills();
  }, [user]);

  return {
    bills,
    loading,
    addBill,
    markAsPaid,
    removeBill,
    refetch: fetchBills,
  };
};