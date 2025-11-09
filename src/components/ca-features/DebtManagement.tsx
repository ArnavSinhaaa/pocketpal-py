import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDebts } from '@/hooks/useDebts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target, TrendingDown, Calculator, AlertCircle, PiggyBank, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DebtStrategy {
  payoffOrder: Array<{
    debtType: string;
    lender: string;
    amount: number;
    monthsToPayoff: number;
    totalInterest: number;
  }>;
  totalMonths: number;
  totalInterest: number;
  description: string;
}

interface DebtAnalysis {
  snowballStrategy: DebtStrategy;
  avalancheStrategy: DebtStrategy;
  interestSavings: {
    snowballVsMinimum: number;
    avalancheVsMinimum: number;
    avalancheVsSnowball: number;
  };
  acceleratedPayoff: Array<{
    extraPaymentPercent: number;
    extraMonthlyAmount: number;
    newPayoffMonths: number;
    interestSaved: number;
    timeReduction: string;
  }>;
  recommendations: {
    immediate: string[];
    strategy: string[];
    longTerm: string[];
  };
  milestones: Array<{
    milestone: string;
    targetDate: string;
    amountPaid: number;
  }>;
  actualValues: {
    totalDebt: number;
    totalMonthlyPayment: number;
    weightedInterestRate: number;
    debtCount: number;
  };
  summary: string;
}

export const DebtManagement = () => {
  const { debts, loading: dataLoading, addDebt, deleteDebt } = useDebts();
  const [analysis, setAnalysis] = useState<DebtAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    liability_type: '',
    lender: '',
    principal_amount: '',
    outstanding_amount: '',
    interest_rate: '',
    emi_amount: '',
    start_date: '',
    end_date: '',
    next_payment_date: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.liability_type || !formData.lender || !formData.principal_amount || 
        !formData.outstanding_amount || !formData.interest_rate || !formData.start_date) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    addDebt({
      liability_type: formData.liability_type,
      lender: formData.lender,
      principal_amount: Number(formData.principal_amount),
      outstanding_amount: Number(formData.outstanding_amount),
      interest_rate: Number(formData.interest_rate),
      emi_amount: formData.emi_amount ? Number(formData.emi_amount) : undefined,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      next_payment_date: formData.next_payment_date || undefined,
      notes: formData.notes || undefined,
    });

    setFormData({
      liability_type: '',
      lender: '',
      principal_amount: '',
      outstanding_amount: '',
      interest_rate: '',
      emi_amount: '',
      start_date: '',
      end_date: '',
      next_payment_date: '',
      notes: ''
    });
    setDialogOpen(false);
  };

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('debt-analyzer');

      if (error) {
        if (error.message?.includes('Rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.message?.includes('Payment required')) {
          throw new Error('AI credits exhausted. Please add credits to continue.');
        }
        throw error;
      }

      setAnalysis(data);
    } catch (error: any) {
      console.error('Debt analysis error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate debt analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.outstanding_amount), 0);
  const totalMonthly = debts.reduce((sum, d) => sum + Number(d.emi_amount || 0), 0);

  if (dataLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Debt Management & Payoff Strategy
            </CardTitle>
            <CardDescription>
              Snowball vs Avalanche calculators with interest savings projections
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Debt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Debt/Liability</DialogTitle>
                  <DialogDescription>
                    Enter the details of your debt or liability
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="liability_type">Debt Type *</Label>
                      <Select value={formData.liability_type} onValueChange={(v) => setFormData({...formData, liability_type: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Home Loan">Home Loan</SelectItem>
                          <SelectItem value="Car Loan">Car Loan</SelectItem>
                          <SelectItem value="Personal Loan">Personal Loan</SelectItem>
                          <SelectItem value="Education Loan">Education Loan</SelectItem>
                          <SelectItem value="Credit Card">Credit Card</SelectItem>
                          <SelectItem value="Business Loan">Business Loan</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lender">Lender/Bank *</Label>
                      <Input
                        id="lender"
                        value={formData.lender}
                        onChange={(e) => setFormData({...formData, lender: e.target.value})}
                        placeholder="HDFC Bank"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="principal_amount">Principal Amount *</Label>
                      <Input
                        id="principal_amount"
                        type="number"
                        value={formData.principal_amount}
                        onChange={(e) => setFormData({...formData, principal_amount: e.target.value})}
                        placeholder="500000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="outstanding_amount">Outstanding Amount *</Label>
                      <Input
                        id="outstanding_amount"
                        type="number"
                        value={formData.outstanding_amount}
                        onChange={(e) => setFormData({...formData, outstanding_amount: e.target.value})}
                        placeholder="350000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interest_rate">Interest Rate (%) *</Label>
                      <Input
                        id="interest_rate"
                        type="number"
                        step="0.01"
                        value={formData.interest_rate}
                        onChange={(e) => setFormData({...formData, interest_rate: e.target.value})}
                        placeholder="8.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emi_amount">EMI Amount</Label>
                      <Input
                        id="emi_amount"
                        type="number"
                        value={formData.emi_amount}
                        onChange={(e) => setFormData({...formData, emi_amount: e.target.value})}
                        placeholder="15000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="next_payment_date">Next Payment</Label>
                      <Input
                        id="next_payment_date"
                        type="date"
                        value={formData.next_payment_date}
                        onChange={(e) => setFormData({...formData, next_payment_date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional notes"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Debt</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={fetchAnalysis} disabled={loading || debts.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Debt Strategy'
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Debt Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">Total Debt</p>
            <p className="text-2xl font-bold text-red-600">₹{totalDebt.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-300">Monthly Payment</p>
            <p className="text-2xl font-bold text-orange-600">₹{totalMonthly.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground">Active Debts</p>
            <p className="text-2xl font-bold">{debts.length}</p>
          </div>
        </div>

        {debts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No debts tracked</p>
            <p className="text-sm text-muted-foreground">Add debts to get AI-powered payoff strategies</p>
          </div>
        )}

        {/* Current Debts List */}
        {debts.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Current Debts</h4>
            <div className="space-y-2">
              {debts.map((debt) => (
                <div key={debt.id} className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{debt.liability_type}</p>
                      <p className="text-sm text-muted-foreground">{debt.lender}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{Number(debt.interest_rate)}% APR</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteDebt(debt.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Outstanding</p>
                      <p className="font-semibold">₹{Number(debt.outstanding_amount).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">EMI</p>
                      <p className="font-semibold">₹{Number(debt.emi_amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Next Payment</p>
                      <p className="font-semibold">
                        {debt.next_payment_date ? new Date(debt.next_payment_date).toLocaleDateString('en-IN') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis Results */}
        {analysis && (
          <Tabs defaultValue="strategies" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="strategies">Strategies</TabsTrigger>
              <TabsTrigger value="accelerated">Accelerated</TabsTrigger>
              <TabsTrigger value="recommendations">Action Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="strategies" className="space-y-6">
              {/* Snowball vs Avalanche Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Snowball Strategy */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">🎯 Debt Snowball</h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">Pay smallest debts first</p>
                    </div>
                    <TrendingDown className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span>Total Time:</span>
                      <span className="font-semibold">{analysis.snowballStrategy.totalMonths} months</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Interest:</span>
                      <span className="font-semibold">₹{analysis.snowballStrategy.totalInterest.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Savings:</span>
                      <span className="font-semibold">₹{analysis.interestSavings.snowballVsMinimum.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-800 dark:text-blue-200">{analysis.snowballStrategy.description}</p>
                </div>

                {/* Avalanche Strategy */}
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100">⚡ Debt Avalanche</h4>
                      <p className="text-xs text-green-700 dark:text-green-300">Pay highest interest first</p>
                    </div>
                    <PiggyBank className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span>Total Time:</span>
                      <span className="font-semibold">{analysis.avalancheStrategy.totalMonths} months</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Interest:</span>
                      <span className="font-semibold">₹{analysis.avalancheStrategy.totalInterest.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Savings:</span>
                      <span className="font-semibold">₹{analysis.interestSavings.avalancheVsMinimum.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <p className="text-xs text-green-800 dark:text-green-200">{analysis.avalancheStrategy.description}</p>
                </div>
              </div>

              {/* Interest Savings Highlight */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Interest Savings Analysis
                </h4>
                <p className="text-sm mb-2">
                  The Avalanche method saves you{' '}
                  <span className="font-bold text-primary">
                    ₹{analysis.interestSavings.avalancheVsSnowball.toLocaleString('en-IN')}
                  </span>{' '}
                  more than the Snowball method.
                </p>
                <p className="text-xs text-muted-foreground">
                  However, Snowball provides psychological wins by eliminating debts faster, which can help maintain motivation.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="accelerated" className="space-y-4">
              <h4 className="font-semibold">Accelerated Payoff Options</h4>
              {analysis.acceleratedPayoff.map((option, i) => (
                <div key={i} className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">+{option.extraPaymentPercent}% Extra Payment</p>
                      <p className="text-sm text-muted-foreground">
                        Additional ₹{option.extraMonthlyAmount.toLocaleString('en-IN')}/month
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20">
                      {option.timeReduction}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">New Payoff Time</p>
                      <p className="font-semibold">{option.newPayoffMonths} months</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Interest Saved</p>
                      <p className="font-semibold text-green-600">
                        ₹{option.interestSaved.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {/* Recommendations */}
              <div className="space-y-3">
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">🚨 Immediate Actions</h4>
                  <ul className="space-y-1">
                    {analysis.recommendations.immediate.map((r, i) => (
                      <li key={i} className="text-sm text-red-800 dark:text-red-200">• {r}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 Strategy Actions</h4>
                  <ul className="space-y-1">
                    {analysis.recommendations.strategy.map((r, i) => (
                      <li key={i} className="text-sm text-blue-800 dark:text-blue-200">• {r}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">🎯 Long-term Goals</h4>
                  <ul className="space-y-1">
                    {analysis.recommendations.longTerm.map((r, i) => (
                      <li key={i} className="text-sm text-green-800 dark:text-green-200">• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Milestones */}
              {analysis.milestones.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Debt-Free Milestones</h4>
                  <div className="space-y-2">
                    {analysis.milestones.map((milestone, i) => (
                      <div key={i} className="p-3 bg-card rounded-lg border flex items-center justify-between">
                        <div>
                          <p className="font-medium">{milestone.milestone}</p>
                          <p className="text-xs text-muted-foreground">{milestone.targetDate}</p>
                        </div>
                        <Badge variant="outline">
                          ₹{milestone.amountPaid.toLocaleString('en-IN')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Summary */}
        {analysis && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2">CA Summary</h4>
            <p className="text-sm leading-relaxed">{analysis.summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
