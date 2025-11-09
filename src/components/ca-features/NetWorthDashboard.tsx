import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNetWorth } from '@/hooks/useNetWorth';
import { useInvestments } from '@/hooks/useInvestments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wallet, TrendingUp, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface NetWorthAnalysis {
  financialRatios: {
    debtToAssetRatio: number;
    liquidityRatio: number;
    solvencyRatio: number;
    interpretation: string;
  };
  wealthGrade: string;
  analysis: {
    strengths: string[];
    concerns: string[];
    opportunities: string[];
  };
  netWorthGrowthPlan: {
    shortTerm: { target: number; timeframe: string; actions: string[] };
    mediumTerm: { target: number; timeframe: string; actions: string[] };
    longTerm: { target: number; timeframe: string; actions: string[] };
  };
  recommendations: {
    assetOptimization: string[];
    debtManagement: string[];
    wealthBuilding: string[];
  };
  milestones: Array<{ milestone: string; targetAmount: number; estimatedTimeframe: string }>;
  actualValues: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    assetBreakdown: Record<string, number>;
    liabilityBreakdown: Record<string, number>;
  };
  summary: string;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export const NetWorthDashboard = () => {
  const { assets, liabilities, loading: dataLoading } = useNetWorth();
  const { investments } = useInvestments();
  const [analysis, setAnalysis] = useState<NetWorthAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('net-worth-calculator');

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
      console.error('Net worth analysis error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate net worth analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalInvestments = investments.reduce((sum, inv) => sum + Number(inv.current_value || 0), 0);
  const totalAssets = assets.reduce((sum, asset) => sum + Number(asset.current_value), 0);
  const totalLiabilities = liabilities.reduce((sum, lib) => sum + Number(lib.outstanding_amount), 0);
  const totalAssetValue = totalInvestments + totalAssets;
  const netWorth = totalAssetValue - totalLiabilities;

  const assetData = [
    { name: 'Investments', value: totalInvestments },
    ...assets.map(asset => ({ name: asset.name, value: Number(asset.current_value) }))
  ].filter(item => item.value > 0);

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A+': 'text-green-600 bg-green-50 dark:bg-green-950/20',
      'A': 'text-green-600 bg-green-50 dark:bg-green-950/20',
      'B': 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
      'C': 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20',
      'D': 'text-red-600 bg-red-50 dark:bg-red-950/20',
    };
    return colors[grade] || 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
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
              <Wallet className="h-5 w-5" />
              Net Worth Dashboard
            </CardTitle>
            <CardDescription>Complete assets vs liabilities analysis with wealth building roadmap</CardDescription>
          </div>
          <Button onClick={fetchAnalysis} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Net Worth'
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Net Worth Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300">Total Assets</p>
            <p className="text-2xl font-bold text-green-600">₹{totalAssetValue.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">Total Liabilities</p>
            <p className="text-2xl font-bold text-red-600">₹{totalLiabilities.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
            <p className="text-sm text-muted-foreground">Net Worth</p>
            <p className="text-2xl font-bold text-primary">₹{netWorth.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Asset Distribution Chart */}
        {assetData.length > 0 && (
          <div className="p-4 bg-card rounded-lg border">
            <h4 className="font-semibold mb-4">Asset Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={assetData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI Analysis */}
        {analysis && (
          <>
            {/* Wealth Grade & Ratios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-card rounded-lg border">
                <p className="text-sm text-muted-foreground mb-2">Wealth Grade</p>
                <Badge className={`text-2xl font-bold px-4 py-2 ${getGradeColor(analysis.wealthGrade)}`}>
                  {analysis.wealthGrade}
                </Badge>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <p className="text-sm font-medium mb-2">Financial Ratios</p>
                <div className="space-y-1 text-sm">
                  <p>Debt-to-Asset: <span className="font-semibold">{((analysis.financialRatios.debtToAssetRatio || 0) * 100).toFixed(1)}%</span></p>
                  <p>Liquidity: <span className="font-semibold">{(analysis.financialRatios.liquidityRatio || 0).toFixed(2)}</span></p>
                  <p>Solvency: <span className="font-semibold">{(analysis.financialRatios.solvencyRatio || 0).toFixed(2)}</span></p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{analysis.financialRatios.interpretation}</p>
              </div>
            </div>

            {/* Analysis */}
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

            {/* Growth Plan */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Net Worth Growth Plan
              </h4>
              <div className="space-y-3">
                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Short-term ({analysis.netWorthGrowthPlan.shortTerm.timeframe})</p>
                    <Badge variant="outline">₹{(analysis.netWorthGrowthPlan.shortTerm.target || 0).toLocaleString('en-IN')}</Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {analysis.netWorthGrowthPlan.shortTerm.actions.map((action, i) => (
                      <li key={i}>• {action}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Medium-term ({analysis.netWorthGrowthPlan.mediumTerm.timeframe})</p>
                    <Badge variant="outline">₹{(analysis.netWorthGrowthPlan.mediumTerm.target || 0).toLocaleString('en-IN')}</Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {analysis.netWorthGrowthPlan.mediumTerm.actions.map((action, i) => (
                      <li key={i}>• {action}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Long-term ({analysis.netWorthGrowthPlan.longTerm.timeframe})</p>
                    <Badge variant="outline">₹{(analysis.netWorthGrowthPlan.longTerm.target || 0).toLocaleString('en-IN')}</Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {analysis.netWorthGrowthPlan.longTerm.actions.map((action, i) => (
                      <li key={i}>• {action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Milestones */}
            {analysis.milestones.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Wealth Milestones</h4>
                <div className="space-y-2">
                  {analysis.milestones.map((milestone, i) => (
                    <div key={i} className="p-3 bg-card rounded-lg border flex items-center justify-between">
                      <div>
                        <p className="font-medium">{milestone.milestone}</p>
                        <p className="text-xs text-muted-foreground">{milestone.estimatedTimeframe}</p>
                      </div>
                      <Badge variant="outline" className="ml-4">
                        ₹{(milestone.targetAmount || 0).toLocaleString('en-IN')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

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