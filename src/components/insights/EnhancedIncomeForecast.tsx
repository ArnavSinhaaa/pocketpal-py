import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, TrendingDown, Minus, AlertCircle, Sparkles, Calculator } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from "recharts";

interface MonthForecast {
  income: number;
  expenses: number;
  savings: number;
  confidenceLow?: number;
  confidenceHigh?: number;
}

interface ForecastData {
  forecast: Record<string, MonthForecast>;
  trend: 'growth' | 'decline' | 'stable';
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  insights: string[];
  recommendations: string[];
  alerts?: string[];
}

export function EnhancedIncomeForecast() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<1 | 3 | 6>(3);
  const [whatIfIncome, setWhatIfIncome] = useState("");
  const [whatIfGrowth, setWhatIfGrowth] = useState("");
  const [scenarioMode, setScenarioMode] = useState(false);
  const { toast } = useToast();

  const fetchForecast = async (applyScenario = false) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view forecast",
          variant: "destructive",
        });
        return;
      }

      const payload: any = { timeframe };
      
      if (applyScenario) {
        payload.whatIfScenario = {};
        if (whatIfIncome) payload.whatIfScenario.additionalIncome = Number(whatIfIncome);
        if (whatIfGrowth) payload.whatIfScenario.incomeGrowthPercent = Number(whatIfGrowth);
      }

      const { data, error } = await supabase.functions.invoke('income-forecast', {
        body: payload,
      });

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

      setForecast(data);
      setScenarioMode(applyScenario);
    } catch (error) {
      console.error('Forecast error:', error);
      toast({
        title: "Error",
        description: "Failed to generate forecast. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toCurrency = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const getChartData = () => {
    if (!forecast) return [];
    
    return Object.entries(forecast.forecast).map(([key, data], index) => ({
      name: `Month ${index + 1}`,
      income: data.income,
      expenses: data.expenses,
      savings: data.savings,
      confidenceLow: data.confidenceLow || data.income * 0.9,
      confidenceHigh: data.confidenceHigh || data.income * 1.1,
    }));
  };

  const getTrendIcon = () => {
    if (!forecast) return null;
    switch (forecast.trend) {
      case 'growth': return <TrendingUp className="h-5 w-5 text-success" />;
      case 'decline': return <TrendingDown className="h-5 w-5 text-destructive" />;
      default: return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getConfidenceBadge = () => {
    if (!forecast) return null;
    const variant = forecast.confidence === 'high' ? 'default' : forecast.confidence === 'medium' ? 'secondary' : 'destructive';
    return <Badge variant={variant as any}>{forecast.confidence.toUpperCase()} CONFIDENCE</Badge>;
  };

  return (
    <Card className="backdrop-blur-sm bg-card/95 border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              AI Income Forecast
              {scenarioMode && <Badge variant="outline" className="ml-2">Scenario Mode</Badge>}
            </CardTitle>
            <CardDescription>
              Advanced regression analysis with confidence intervals
            </CardDescription>
          </div>
          {forecast && (
            <div className="flex gap-2 items-center">
              {getTrendIcon()}
              {getConfidenceBadge()}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeframe Selection */}
        <div className="space-y-2">
          <Label>Forecast Timeframe</Label>
          <Tabs value={timeframe.toString()} onValueChange={(v) => setTimeframe(Number(v) as 1 | 3 | 6)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1">1 Month</TabsTrigger>
              <TabsTrigger value="3">3 Months</TabsTrigger>
              <TabsTrigger value="6">6 Months</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* What-If Scenario */}
        <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <Label className="text-base font-semibold">What-If Scenario Testing</Label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="additional-income">Additional Monthly Income (₹)</Label>
              <Input
                id="additional-income"
                type="number"
                placeholder="e.g., 5000"
                value={whatIfIncome}
                onChange={(e) => setWhatIfIncome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-growth">Income Growth (%)</Label>
              <Input
                id="income-growth"
                type="number"
                placeholder="e.g., 20"
                value={whatIfGrowth}
                onChange={(e) => setWhatIfGrowth(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => fetchForecast(true)} 
              disabled={loading || (!whatIfIncome && !whatIfGrowth)}
              className="flex-1"
              variant="outline"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Test Scenario
            </Button>
            {scenarioMode && (
              <Button 
                onClick={() => {
                  setWhatIfIncome("");
                  setWhatIfGrowth("");
                  fetchForecast(false);
                }} 
                variant="ghost"
              >
                Reset to Actual
              </Button>
            )}
          </div>
        </div>

        {/* Generate Button */}
        {!forecast && (
          <Button 
            onClick={() => fetchForecast(false)} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Forecast
              </>
            )}
          </Button>
        )}

        {/* Results */}
        {forecast && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <h3 className="font-semibold mb-2 text-lg">Forecast Summary</h3>
              <p className="text-foreground/90">{forecast.summary}</p>
            </div>

            {/* Alerts */}
            {forecast.alerts && forecast.alerts.length > 0 && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-destructive mb-2">Alerts</h3>
                    <ul className="space-y-1">
                      {forecast.alerts.map((alert, i) => (
                        <li key={i} className="text-sm text-foreground/90">{alert}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
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
                  <Area
                    type="monotone"
                    dataKey="confidenceLow"
                    stackId="1"
                    stroke="none"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                    name="Confidence Range"
                  />
                  <Area
                    type="monotone"
                    dataKey="confidenceHigh"
                    stackId="1"
                    stroke="none"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Income"
                    dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    name="Expenses"
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Savings"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(forecast.forecast).map(([key, data], index) => (
                <Card key={key} className="bg-card/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Month {index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Income:</span>
                      <span className="font-semibold text-primary">{toCurrency(data.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Expenses:</span>
                      <span className="font-semibold text-destructive">{toCurrency(data.expenses)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm font-medium">Savings:</span>
                      <span className="font-bold text-success">{toCurrency(data.savings)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Insights */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Key Insights</h3>
              <ul className="space-y-2">
                {forecast.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="space-y-2 p-4 rounded-lg bg-success/10 border border-success/20">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-success" />
                Actionable Recommendations
              </h3>
              <ul className="space-y-2">
                {forecast.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-success mt-1">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Regenerate Button */}
            <Button 
              onClick={() => fetchForecast(scenarioMode)} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Regenerate Forecast
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
