import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Asset {
  id: string;
  user_id: string;
  asset_type: string;
  name: string;
  purchase_date?: string;
  purchase_value: number;
  current_value: number;
  depreciation_rate: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  liability_type: string;
  lender: string;
  principal_amount: number;
  outstanding_amount: number;
  interest_rate: number;
  emi_amount?: number;
  start_date: string;
  end_date?: string;
  next_payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useNetWorth = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const [assetsRes, liabilitiesRes] = await Promise.all([
        supabase.from('assets').select('*').eq('user_id', user.id).order('current_value', { ascending: false }),
        supabase.from('liabilities').select('*').eq('user_id', user.id).order('outstanding_amount', { ascending: false }),
      ]);

      if (assetsRes.error) throw assetsRes.error;
      if (liabilitiesRes.error) throw liabilitiesRes.error;

      setAssets(assetsRes.data || []);
      setLiabilities(liabilitiesRes.data || []);
    } catch (error) {
      console.error('Error fetching net worth data:', error);
      toast({
        title: "Error",
        description: "Failed to load net worth data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAsset = async (asset: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('assets')
        .insert([{ ...asset, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setAssets(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Asset added successfully",
      });
    } catch (error) {
      console.error('Error adding asset:', error);
      toast({
        title: "Error",
        description: "Failed to add asset",
        variant: "destructive",
      });
    }
  };

  const addLiability = async (liability: Omit<Liability, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('liabilities')
        .insert([{ ...liability, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setLiabilities(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Liability added successfully",
      });
    } catch (error) {
      console.error('Error adding liability:', error);
      toast({
        title: "Error",
        description: "Failed to add liability",
        variant: "destructive",
      });
    }
  };

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    try {
      const { error } = await supabase.from('assets').update(updates).eq('id', id);
      if (error) throw error;
      setAssets(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      toast({ title: "Success", description: "Asset updated" });
    } catch (error) {
      console.error('Error updating asset:', error);
      toast({ title: "Error", description: "Failed to update asset", variant: "destructive" });
    }
  };

  const updateLiability = async (id: string, updates: Partial<Liability>) => {
    try {
      const { error } = await supabase.from('liabilities').update(updates).eq('id', id);
      if (error) throw error;
      setLiabilities(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      toast({ title: "Success", description: "Liability updated" });
    } catch (error) {
      console.error('Error updating liability:', error);
      toast({ title: "Error", description: "Failed to update liability", variant: "destructive" });
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      setAssets(prev => prev.filter(a => a.id !== id));
      toast({ title: "Success", description: "Asset deleted" });
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({ title: "Error", description: "Failed to delete asset", variant: "destructive" });
    }
  };

  const deleteLiability = async (id: string) => {
    try {
      const { error } = await supabase.from('liabilities').delete().eq('id', id);
      if (error) throw error;
      setLiabilities(prev => prev.filter(l => l.id !== id));
      toast({ title: "Success", description: "Liability deleted" });
    } catch (error) {
      console.error('Error deleting liability:', error);
      toast({ title: "Error", description: "Failed to delete liability", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchData();

    const assetsChannel = supabase.channel('assets_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'assets', filter: `user_id=eq.${user?.id}` },
        () => fetchData()
      )
      .subscribe();

    const liabilitiesChannel = supabase.channel('liabilities_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'liabilities', filter: `user_id=eq.${user?.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assetsChannel);
      supabase.removeChannel(liabilitiesChannel);
    };
  }, [user]);

  return {
    assets,
    liabilities,
    loading,
    addAsset,
    addLiability,
    updateAsset,
    updateLiability,
    deleteAsset,
    deleteLiability,
    refetch: fetchData,
  };
};