import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInvestments } from '@/hooks/useInvestments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, TrendingDown, PieChart, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PortfolioAnalysis {
  overallScore: number;
  diversificationScore: number;
  riskLevel: string;
  performanceRating: string;
  analysis: {
    strengths: string[];
    concerns: string[];
    opportunities: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  assetAllocationAdvice: {
    current: string;
    ideal: string;
    rebalancing: string[];
  };
  taxOptimization: string[];
  summary: string;
}

export const InvestmentPortfolio = () => {
  const { investments, loading: dataLoading } = useInvestments();
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('portfolio-analysis');

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
      console.error('Portfolio analysis error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate portfolio analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalInvested = investments.reduce((sum, inv) => 
    sum + (inv.purchase_price * inv.quantity), 0
  );
  
  const totalCurrent = investments.reduce((sum, inv) => 
    sum + (inv.current_value || 0), 0
  );
  
  const returns = totalCurrent - totalInvested;
  const returnsPercentage = totalInvested > 0 ? (returns / totalInvested) * 100 : 0;

  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-500',
      moderate: 'bg-yellow-500',
      high: 'bg-orange-500',
      very_high: 'bg-red-500',
    };
    return colors[risk] || 'bg-gray-500';
  };

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
              <PieChart className="h-5 w-5" />
              Investment Portfolio Analysis
            </CardTitle>
            <CardDescription>CA-level portfolio insights and recommendations</CardDescription>
          </div>
          <Button onClick={fetchAnalysis} disabled={loading || investments.length === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Portfolio'
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground">Total Invested</p>
            <p className="text-2xl font-bold">₹{totalInvested.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground">Current Value</p>
            <p className="text-2xl font-bold">₹{totalCurrent.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground">Returns</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {returns >= 0 ? '+' : ''}₹{returns.toLocaleString('en-IN')}
              </p>
              {returns >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className={`text-sm ${returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {returnsPercentage.toFixed(2)}%
            </p>
          </div>
        </div>

        {investments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No investments tracked yet</p>
            <p className="text-sm text-muted-foreground">Add investments to get AI-powered portfolio analysis</p>
          </div>
        )}

        {/* AI Analysis Results */}
        {analysis && (
          <>
            {/* Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-card rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Overall Score</p>
                  <Badge variant="outline">{analysis.overallScore}/100</Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${analysis.overallScore}%` }}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-card rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Diversification</p>
                  <Badge variant="outline">{analysis.diversificationScore}/100</Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${analysis.diversificationScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Risk & Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-card rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">Risk Level</p>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${getRiskColor(analysis.riskLevel)}`} />
                  <p className="font-semibold capitalize">{analysis.riskLevel.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">Performance Rating</p>
                <p className="font-semibold capitalize">{analysis.performanceRating}</p>
              </div>
            </div>

            {/* Analysis Sections */}
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">✅ Strengths</h4>
                <ul className="space-y-1">
                  {analysis.analysis.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-green-800 dark:text-green-200">• {s}</li>
                  ))}
                </ul>
              </div>

              {analysis.analysis.concerns.length > 0 && (
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">⚠️ Concerns</h4>
                  <ul className="space-y-1">
                    {analysis.analysis.concerns.map((c, i) => (
                      <li key={i} className="text-sm text-orange-800 dark:text-orange-200">• {c}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Opportunities</h4>
                <ul className="space-y-1">
                  {analysis.analysis.opportunities.map((o, i) => (
                    <li key={i} className="text-sm text-blue-800 dark:text-blue-200">• {o}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h4 className="font-semibold">Action Plan</h4>
              <div className="space-y-2">
                <div className="p-3 bg-card rounded-lg border">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">🚨 Immediate Actions</p>
                  <ul className="space-y-1">
                    {analysis.recommendations.immediate.map((r, i) => (
                      <li key={i} className="text-sm">• {r}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-card rounded-lg border">
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">📅 Short-term (1-3 months)</p>
                  <ul className="space-y-1">
                    {analysis.recommendations.shortTerm.map((r, i) => (
                      <li key={i} className="text-sm">• {r}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-card rounded-lg border">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">🎯 Long-term (6+ months)</p>
                  <ul className="space-y-1">
                    {analysis.recommendations.longTerm.map((r, i) => (
                      <li key={i} className="text-sm">• {r}</li>
                    ))}
                  </ul>
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