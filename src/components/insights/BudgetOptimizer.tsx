import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PiggyBank, TrendingDown, Lightbulb, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface CategoryBudget {
  current: number;
  recommended: number;
  savings: number;
}

interface BudgetBreakdown {
  needs: { amount: number; percentage: number };
  wants: { amount: number; percentage: number };
  savings: { amount: number; percentage: number };
}

interface BudgetData {
  optimizedBudget: Record<string, CategoryBudget>;
  totalSavingsPotential: number;
  budgetBreakdown: BudgetBreakdown;
  recommendations: string[];
  quickWins: string[];
  summary: string;
}

export function BudgetOptimizer() {
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to optimize your budget",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('budget-optimizer');

      if (error) {
        if (error.message?.includes('429')) {
          toast({
            title: "Rate limit exceeded",
            description: "Please try again in a few moments",
            variant: "destructive",
          });
        } else if (error.message?.includes('402')) {
          toast({
            title: "Credits required",
            description: "Please add credits to your Lovable AI workspace",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      setBudget(data);
      toast({
        title: "Budget Optimized!",
        description: `Potential savings: ₹${data.totalSavingsPotential.toLocaleString('en-IN')}`,
      });
    } catch (error) {
      console.error('Budget optimizer error:', error);
      toast({
        title: "Error",
        description: "Failed to optimize budget. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toCurrency = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const getChartData = () => {
    if (!budget) return [];
    
    return Object.entries(budget.optimizedBudget).map(([category, data]) => ({
      category,
      current: data.current,
      recommended: data.recommended,
      savings: data.savings,
    }));
  };

  const getBreakdownData = () => {
    if (!budget) return [];
    
    return [
      { name: 'Needs', value: budget.budgetBreakdown.needs.percentage, amount: budget.budgetBreakdown.needs.amount },
      { name: 'Wants', value: budget.budgetBreakdown.wants.percentage, amount: budget.budgetBreakdown.wants.amount },
      { name: 'Savings', value: budget.budgetBreakdown.savings.percentage, amount: budget.budgetBreakdown.savings.amount },
    ];
  };

  return (
    <Card className="backdrop-blur-sm bg-card/95 border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <PiggyBank className="h-6 w-6 text-primary" />
              AI Budget Optimizer
            </CardTitle>
            <CardDescription>
              Smart budget recommendations based on your spending patterns
            </CardDescription>
          </div>
          {budget && (
            <Badge className="text-lg px-4 py-2">
              <TrendingDown className="h-4 w-4 mr-2" />
              Save {toCurrency(budget.totalSavingsPotential)}/mo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!budget ? (
          <Button 
            onClick={fetchBudget} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Optimizing Your Budget...
              </>
            ) : (
              <>
                <PiggyBank className="h-5 w-5 mr-2" />
                Optimize My Budget
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <h3 className="font-semibold mb-2 text-lg">Budget Summary</h3>
              <p className="text-foreground/90">{budget.summary}</p>
            </div>

            {/* Quick Wins */}
            {budget.quickWins.length > 0 && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-success" />
                  Quick Wins - Start Here!
                </h3>
                <ul className="space-y-2">
                  {budget.quickWins.map((win, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Budget Breakdown - 50/30/20 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Budget Breakdown</h3>
              {getBreakdownData().map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">
                      {toCurrency(item.amount)} ({item.value.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={item.value} className="h-2" />
                </div>
              ))}
            </div>

            {/* Category Comparison Chart */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Category Optimization</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      className="text-muted-foreground"
                    />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => toCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="current" fill="hsl(var(--muted))" name="Current Spending" />
                    <Bar dataKey="recommended" fill="hsl(var(--primary))" name="Recommended" />
                    <Bar dataKey="savings" fill="hsl(var(--success))" name="Potential Savings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Recommendations */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Detailed Recommendations</h3>
              <div className="space-y-3">
                {budget.recommendations.map((rec, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Regenerate Button */}
            <Button 
              onClick={fetchBudget} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Recalculate Budget
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
