import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calculator, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TaxAnalysis {
  currentTaxLiability: number;
  potentialSavings: number;
  effectiveTaxRate: number;
  recommendations: {
    immediate: Array<{ action: string; savings: number; effort: string }>;
    shortTerm: Array<{ action: string; savings: number; effort: string }>;
    longTerm: Array<{ action: string; savings: number; effort: string }>;
  };
  deductionOpportunities: Array<{
    section: string;
    description: string;
    limit: number;
    utilized: number;
    available: number;
    howToClaim: string;
  }>;
  regimeComparison: {
    oldRegime: { tax: number; pros: string[]; cons: string[] };
    newRegime: { tax: number; pros: string[]; cons: string[] };
    recommendation: string;
  };
  investmentSuggestions: Array<{
    instrument: string;
    amount: number;
    taxBenefit: number;
    additionalBenefits: string;
  }>;
  quickWins: string[];
  summary: string;
}

export const TaxOptimizer = () => {
  const [analysis, setAnalysis] = useState<TaxAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tax-optimizer');

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
      console.error('Tax optimizer error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate tax analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEffortColor = (effort: string) => {
    const colors: Record<string, string> = {
      low: 'text-green-600 bg-green-50 dark:bg-green-950/20',
      medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20',
      high: 'text-red-600 bg-red-50 dark:bg-red-950/20',
    };
    return colors[effort] || 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Advanced Tax Optimizer
            </CardTitle>
            <CardDescription>CA-level tax planning and optimization strategies</CardDescription>
          </div>
          <Button onClick={fetchAnalysis} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Optimize Taxes'
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!analysis && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Tax Optimization Analysis</p>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              Get CA-level insights on tax-saving opportunities, deduction strategies, and regime comparison
            </p>
          </div>
        )}

        {analysis && (
          <>
            {/* Tax Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-card rounded-lg border">
                <p className="text-sm text-muted-foreground">Current Tax Liability</p>
                <p className="text-2xl font-bold">₹{analysis.currentTaxLiability.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700 dark:text-green-300">Potential Savings</p>
                </div>
                <p className="text-2xl font-bold text-green-600">₹{analysis.potentialSavings.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <p className="text-sm text-muted-foreground">Effective Tax Rate</p>
                <p className="text-2xl font-bold">{analysis.effectiveTaxRate.toFixed(1)}%</p>
              </div>
            </div>

            {/* Quick Wins */}
            {analysis.quickWins.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Quick Wins (Easy Tax Savings)
                </h4>
                <ul className="space-y-2">
                  {analysis.quickWins.map((win, i) => (
                    <li key={i} className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Deduction Opportunities */}
            <div>
              <h4 className="font-semibold mb-3">Tax Deduction Opportunities</h4>
              <div className="space-y-3">
                {analysis.deductionOpportunities.map((opp, i) => (
                  <div key={i} className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Section {opp.section}</Badge>
                        <p className="text-sm font-medium">{opp.description}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Limit: ₹{opp.limit.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Utilized: ₹{opp.utilized.toLocaleString('en-IN')}</span>
                        <span>Available: ₹{opp.available.toLocaleString('en-IN')}</span>
                      </div>
                      <Progress value={(opp.utilized / opp.limit) * 100} className="h-2" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{opp.howToClaim}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Regime Comparison */}
            <div>
              <h4 className="font-semibold mb-3">Tax Regime Comparison</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-card rounded-lg border">
                  <h5 className="font-medium mb-2">Old Tax Regime</h5>
                  <p className="text-2xl font-bold mb-3">₹{analysis.regimeComparison.oldRegime.tax.toLocaleString('en-IN')}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1">Pros:</p>
                      <ul className="text-xs space-y-1">
                        {analysis.regimeComparison.oldRegime.pros.map((pro, i) => (
                          <li key={i}>• {pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-1">Cons:</p>
                      <ul className="text-xs space-y-1">
                        {analysis.regimeComparison.oldRegime.cons.map((con, i) => (
                          <li key={i}>• {con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <h5 className="font-medium mb-2">New Tax Regime</h5>
                  <p className="text-2xl font-bold mb-3">₹{analysis.regimeComparison.newRegime.tax.toLocaleString('en-IN')}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1">Pros:</p>
                      <ul className="text-xs space-y-1">
                        {analysis.regimeComparison.newRegime.pros.map((pro, i) => (
                          <li key={i}>• {pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-1">Cons:</p>
                      <ul className="text-xs space-y-1">
                        {analysis.regimeComparison.newRegime.cons.map((con, i) => (
                          <li key={i}>• {con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm">
                  <span className="font-semibold">Recommendation:</span> {analysis.regimeComparison.recommendation}
                </p>
              </div>
            </div>

            {/* Investment Suggestions */}
            {analysis.investmentSuggestions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Tax-Saving Investment Suggestions</h4>
                <div className="space-y-3">
                  {analysis.investmentSuggestions.map((inv, i) => (
                    <div key={i} className="p-4 bg-card rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{inv.instrument}</h5>
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300">
                          Save ₹{inv.taxBenefit.toLocaleString('en-IN')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Recommended Amount: ₹{inv.amount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs">{inv.additionalBenefits}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Plan */}
            <div>
              <h4 className="font-semibold mb-3">Prioritized Action Plan</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">🚨 Immediate Actions</p>
                  {analysis.recommendations.immediate.map((rec, i) => (
                    <div key={i} className="p-3 bg-card rounded-lg border flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm">{rec.action}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700">
                          ₹{rec.savings.toLocaleString('en-IN')}
                        </Badge>
                        <Badge className={getEffortColor(rec.effort)}>{rec.effort}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">📅 Short-term (1-3 months)</p>
                  {analysis.recommendations.shortTerm.map((rec, i) => (
                    <div key={i} className="p-3 bg-card rounded-lg border flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm">{rec.action}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700">
                          ₹{rec.savings.toLocaleString('en-IN')}
                        </Badge>
                        <Badge className={getEffortColor(rec.effort)}>{rec.effort}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-2">CA Summary</h4>
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};