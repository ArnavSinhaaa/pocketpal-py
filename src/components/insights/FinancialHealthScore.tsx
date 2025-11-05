import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, TrendingUp, AlertTriangle, Target, CheckCircle2, Clock } from "lucide-react";

interface ScoreItem {
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'poor';
}

interface ActionPlan {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
}

interface HealthData {
  overallScore: number;
  scoreBreakdown: {
    savingsRate: ScoreItem;
    expenseManagement: ScoreItem;
    goalsProgress: ScoreItem;
    consistency: ScoreItem;
    emergencyFund: ScoreItem;
  };
  healthLevel: 'excellent' | 'good' | 'fair' | 'poor';
  strengths: string[];
  weaknesses: string[];
  topPriorities: string[];
  actionPlan: ActionPlan;
  summary: string;
}

export function FinancialHealthScore() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to check your financial health",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('financial-health');

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

      setHealth(data);
    } catch (error) {
      console.error('Financial health error:', error);
      toast({
        title: "Error",
        description: "Failed to analyze financial health. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  const getHealthBadge = () => {
    if (!health) return null;
    const variants: Record<string, any> = {
      excellent: 'default',
      good: 'secondary',
      fair: 'outline',
      poor: 'destructive',
    };
    return <Badge variant={variants[health.healthLevel]}>{health.healthLevel.toUpperCase()}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'good': return <TrendingUp className="h-4 w-4 text-primary" />;
      default: return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-card/95 border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Heart className="h-6 w-6 text-primary" />
              Financial Health Score
            </CardTitle>
            <CardDescription>
              Comprehensive analysis of your financial wellbeing
            </CardDescription>
          </div>
          {health && getHealthBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!health ? (
          <Button 
            onClick={fetchHealth} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Analyzing Your Financial Health...
              </>
            ) : (
              <>
                <Heart className="h-5 w-5 mr-2" />
                Check My Financial Health
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="text-center space-y-4 p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className={`text-6xl font-bold ${getScoreColor(health.overallScore)}`}>
                {health.overallScore}
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <p className="text-foreground/90">{health.summary}</p>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Score Breakdown</h3>
              {Object.entries(health.scoreBreakdown).map(([key, data]) => (
                <div key={key} className="space-y-2 p-3 rounded-lg bg-card border border-border">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(data.status)}
                      <span className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {data.score}/{data.maxScore}
                    </span>
                  </div>
                  <Progress 
                    value={(data.score / data.maxScore) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Your Strengths
                </h3>
                <ul className="space-y-2">
                  {health.strengths.map((strength, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-success">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {health.weaknesses.map((weakness, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-destructive">!</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Top Priorities */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Top 3 Priorities
              </h3>
              <ol className="space-y-2">
                {health.topPriorities.map((priority, i) => (
                  <li key={i} className="text-sm flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">{i + 1}</Badge>
                    <span>{priority}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Action Plan */}
            <Tabs defaultValue="immediate" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="immediate">Immediate</TabsTrigger>
                <TabsTrigger value="shortTerm">Short Term</TabsTrigger>
                <TabsTrigger value="longTerm">Long Term</TabsTrigger>
              </TabsList>
              <TabsContent value="immediate" className="space-y-3 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold">Immediate Actions (This Week)</h3>
                </div>
                {health.actionPlan.immediate.map((action, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm">{action}</p>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="shortTerm" className="space-y-3 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Short Term Actions (This Month)</h3>
                </div>
                {health.actionPlan.shortTerm.map((action, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm">{action}</p>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="longTerm" className="space-y-3 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-success" />
                  <h3 className="font-semibold">Long Term Actions (Next 3-6 Months)</h3>
                </div>
                {health.actionPlan.longTerm.map((action, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm">{action}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            {/* Refresh Button */}
            <Button 
              onClick={fetchHealth} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Refresh Health Score
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
