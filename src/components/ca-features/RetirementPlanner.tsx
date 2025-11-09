import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, Wallet, Calendar, DollarSign, PiggyBank } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RetirementAnalysis {
  sipProjections: Array<{
    monthlyInvestment: number;
    expectedReturn: number;
    years: number;
    futureValue: number;
    totalInvested: number;
    returns: number;
  }>;
  retirementTargets: Array<{
    retirementAge: number;
    yearsToRetirement: number;
    requiredCorpus: number;
    monthlyExpenseAtRetirement: number;
    monthlyInvestmentNeeded: number;
  }>;
  withdrawalStrategies: Array<{
    strategyName: string;
    swpRate: number;
    monthlyIncome: number;
    corpusRequired: number;
    yearsCovered: number;
    description: string;
  }>;
  inflationAnalysis: {
    currentMonthlyExpense: number;
    inflationRate: number;
    projections: Array<{
      year: number;
      monthlyExpense: number;
      annualExpense: number;
    }>;
  };
  recommendations: {
    immediate: string[];
    midTerm: string[];
    longTerm: string[];
  };
  summary: string;
  currentFinancials: {
    annualSalary: number;
    monthlyExpenses: number;
    currentSavings: number;
    monthlySavingCapacity: number;
  };
}

export const RetirementPlanner = () => {
  const [analysis, setAnalysis] = useState<RetirementAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('retirement-planner');

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
      console.error('Retirement analysis error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate retirement analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Retirement Planning Calculator
            </CardTitle>
            <CardDescription>
              SIP projections, corpus targets, and withdrawal strategies
            </CardDescription>
          </div>
          <Button onClick={fetchAnalysis} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Generate Retirement Plan'
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!analysis && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <PiggyBank className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Plan Your Retirement</p>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              Get AI-powered retirement planning with SIP projections, corpus targets, 
              inflation adjustments, and withdrawal strategies
            </p>
          </div>
        )}

        {analysis && (
          <>
            {/* Current Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Annual Salary</p>
                <p className="text-xl font-bold">₹{analysis.currentFinancials.annualSalary.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-4 bg-card rounded-lg border">
                <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                <p className="text-xl font-bold">₹{analysis.currentFinancials.monthlyExpenses.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">Current Savings</p>
                <p className="text-xl font-bold text-green-600">₹{analysis.currentFinancials.currentSavings.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">Saving Capacity</p>
                <p className="text-xl font-bold text-blue-600">₹{analysis.currentFinancials.monthlySavingCapacity.toLocaleString('en-IN')}/mo</p>
              </div>
            </div>

            <Tabs defaultValue="sip" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="sip">SIP Plans</TabsTrigger>
                <TabsTrigger value="targets">Targets</TabsTrigger>
                <TabsTrigger value="withdrawal">Withdrawal</TabsTrigger>
                <TabsTrigger value="recommendations">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="sip" className="space-y-4">
                <h4 className="font-semibold">SIP Investment Projections</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.sipProjections.map((sip, i) => (
                    <div key={i} className="p-4 bg-card rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-lg font-bold">₹{sip.monthlyInvestment.toLocaleString('en-IN')}/month</p>
                          <p className="text-xs text-muted-foreground">
                            {sip.expectedReturn}% return • {sip.years} years
                          </p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Future Value:</span>
                          <span className="font-bold text-green-600">₹{sip.futureValue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Invested:</span>
                          <span className="font-semibold">₹{sip.totalInvested.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Returns:</span>
                          <span className="font-semibold text-primary">₹{sip.returns.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="targets" className="space-y-4">
                <h4 className="font-semibold">Retirement Age Targets</h4>
                <div className="space-y-3">
                  {analysis.retirementTargets.map((target, i) => (
                    <div key={i} className="p-4 bg-card rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-lg">Retire at {target.retirementAge}</p>
                          <p className="text-sm text-muted-foreground">
                            {target.yearsToRetirement} years from now
                          </p>
                        </div>
                        <Badge variant="outline" className="text-lg">
                          <Calendar className="h-4 w-4 mr-1" />
                          {target.retirementAge}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Corpus Needed</p>
                          <p className="font-bold text-primary">₹{target.requiredCorpus.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Monthly Expense</p>
                          <p className="font-semibold">₹{target.monthlyExpenseAtRetirement.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Save Monthly</p>
                          <p className="font-semibold text-orange-600">₹{target.monthlyInvestmentNeeded.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inflation Analysis */}
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-3">
                    Inflation Impact ({analysis.inflationAnalysis.inflationRate}% annually)
                  </h4>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                    Your current monthly expense of ₹{analysis.inflationAnalysis.currentMonthlyExpense.toLocaleString('en-IN')} will grow:
                  </p>
                  <div className="space-y-2">
                    {analysis.inflationAnalysis.projections.slice(0, 4).map((proj) => (
                      <div key={proj.year} className="flex justify-between text-sm">
                        <span>After {proj.year} years:</span>
                        <span className="font-semibold">₹{proj.monthlyExpense.toLocaleString('en-IN')}/month</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="withdrawal" className="space-y-4">
                <h4 className="font-semibold">Systematic Withdrawal Plans (SWP)</h4>
                <div className="space-y-3">
                  {analysis.withdrawalStrategies.map((strategy, i) => (
                    <div key={i} className="p-4 bg-card rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold">{strategy.strategyName}</p>
                          <p className="text-xs text-muted-foreground">{strategy.description}</p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20">
                          {strategy.swpRate}% SWP
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Monthly Income</p>
                          <p className="font-bold text-green-600">₹{strategy.monthlyIncome.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Corpus Required</p>
                          <p className="font-semibold">₹{strategy.corpusRequired.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Coverage</p>
                          <p className="font-semibold">{strategy.yearsCovered} years</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
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
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📋 Mid-Term Goals (2-5 years)</h4>
                    <ul className="space-y-1">
                      {analysis.recommendations.midTerm.map((r, i) => (
                        <li key={i} className="text-sm text-blue-800 dark:text-blue-200">• {r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">🎯 Long-term Strategy (5+ years)</h4>
                    <ul className="space-y-1">
                      {analysis.recommendations.longTerm.map((r, i) => (
                        <li key={i} className="text-sm text-green-800 dark:text-green-200">• {r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Summary */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                CA Summary
              </h4>
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
