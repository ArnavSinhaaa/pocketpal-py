import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, RefreshCw, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ForecastData = {
  forecast: {
    nextMonth: { income: number; expenses: number; savings: number };
    month2: { income: number; expenses: number; savings: number };
    month3: { income: number; expenses: number; savings: number };
  };
  confidence: string;
  insights: string[];
  recommendations: string[];
};

export function IncomeForecast() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to view forecast',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(
        `https://tbsgqvrfoljyjciflosl.supabase.co/functions/v1/income-forecast`,
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
        throw new Error(errorData.error || 'Failed to fetch forecast');
      }

      const data = await response.json();
      setForecast(data);
    } catch (error) {
      console.error('Forecast error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate forecast',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toCurrency = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const months = ['Next Month', 'Month 2', 'Month 3'];
  const monthKeys: (keyof ForecastData['forecast'])[] = ['nextMonth', 'month2', 'month3'];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Income Forecast</CardTitle>
          </div>
          <Button onClick={fetchForecast} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Generate'}
          </Button>
        </div>
        <CardDescription>
          AI-powered predictions using regression analysis on your historical data
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!forecast ? (
          <div className="text-center py-8 text-muted-foreground">
            Click Generate to see your 3-month financial forecast
          </div>
        ) : (
          <div className="space-y-6">
            {/* Confidence Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Confidence:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                forecast.confidence === 'high' ? 'bg-green-100 text-green-700' :
                forecast.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {forecast.confidence.toUpperCase()}
              </span>
            </div>

            {/* Forecast Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {monthKeys.map((key, idx) => {
                const data = forecast.forecast[key];
                return (
                  <Card key={key} className="bg-gradient-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {months[idx]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Income</p>
                        <p className="text-lg font-bold text-green-600">{toCurrency(data.income)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expenses</p>
                        <p className="text-lg font-bold text-red-600">{toCurrency(data.expenses)}</p>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Net Savings</p>
                        <p className={`text-xl font-bold ${data.savings >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {toCurrency(data.savings)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Insights */}
            {forecast.insights && forecast.insights.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Key Insights</h4>
                <ul className="space-y-1">
                  {forecast.insights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {forecast.recommendations && forecast.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {forecast.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
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
