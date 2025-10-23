import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, RefreshCw, TrendingDown, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type SavingOpportunity = {
  category: string;
  current: number;
  potential: number;
  tip: string;
};

type InsightsData = {
  patterns: string[];
  savingOpportunities: SavingOpportunity[];
  unusualSpending: string[];
  recommendations: string[];
  topCategories?: Array<{
    category: string;
    amount: number;
    percentage: string;
    count: number;
  }>;
};

export function SpendingInsights() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to view insights',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(
        `https://tbsgqvrfoljyjciflosl.supabase.co/functions/v1/spending-insights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Insights error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate insights',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toCurrency = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle>Spending Insights</CardTitle>
          </div>
          <Button onClick={fetchInsights} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
        <CardDescription>
          AI-powered analysis to find where you can save money
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!insights ? (
          <div className="text-center py-8 text-muted-foreground">
            Click Analyze to discover saving opportunities in your spending
          </div>
        ) : (
          <div className="space-y-6">
            {/* Saving Opportunities */}
            {insights.savingOpportunities && insights.savingOpportunities.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  Saving Opportunities
                </h4>
                <div className="space-y-3">
                  {insights.savingOpportunities.map((opp, idx) => (
                    <Card key={idx} className="bg-green-50 border-green-200">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-green-800">{opp.category}</span>
                          <span className="text-green-700 font-bold">
                            Save {toCurrency(opp.potential)}/mo
                          </span>
                        </div>
                        <p className="text-sm text-green-700 mb-1">
                          Current: {toCurrency(opp.current)}/month
                        </p>
                        <p className="text-sm text-muted-foreground">{opp.tip}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Spending Patterns */}
            {insights.patterns && insights.patterns.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Spending Patterns</h4>
                <ul className="space-y-1">
                  {insights.patterns.map((pattern, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{pattern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unusual Spending */}
            {insights.unusualSpending && insights.unusualSpending.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Unusual Spending
                </h4>
                <ul className="space-y-1">
                  {insights.unusualSpending.map((obs, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-orange-600 mt-1">⚠</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top Categories */}
            {insights.topCategories && insights.topCategories.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Top Spending Categories</h4>
                <div className="space-y-2">
                  {insights.topCategories.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{cat.category}</span>
                      <div className="text-right">
                        <span className="font-medium">{toCurrency(cat.amount)}</span>
                        <span className="text-xs text-muted-foreground ml-2">({cat.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {insights.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
