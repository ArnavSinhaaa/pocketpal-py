import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, Target, TrendingUp, Edit, Trash2 } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/components/TiltCard";

const toCurrency = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(n);

export function GoalsTracker() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { goals, loading, addGoal, updateGoal, removeGoal } = useGoals();

  const handleAddGoal = async () => {
    if (!title || !targetAmount || parseFloat(targetAmount) <= 0) return;

    setIsSubmitting(true);
    const result = await addGoal({
      title,
      category: category || 'Savings',
      target_amount: parseFloat(targetAmount),
      target_date: targetDate?.toISOString().split('T')[0]
    });

    if (result?.success) {
      setTitle('');
      setCategory('');
      setTargetAmount('');
      setTargetDate(undefined);
    }
    setIsSubmitting(false);
  };

  const handleAddMoney = async (goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    await updateGoal(goalId, {
      current_amount: goal.current_amount + amount
    });
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Goal Section */}
      <TiltCard className="shadow-card border-0 bg-gradient-card">
        <CardHeader className="bg-gradient-primary/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Set Financial Goal
          </CardTitle>
          <CardDescription>Define your savings targets and track progress</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Goal title (e.g., Emergency Fund)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="lg:col-span-2"
            />
            <Input
              placeholder="Category (optional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Target amount (₹)"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal flex-1",
                      !targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "MMM dd, yyyy") : "Target date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={handleAddGoal}
              className="bg-gradient-primary hover:opacity-90"
              disabled={isSubmitting || !title || !targetAmount}
            >
              {isSubmitting ? "Adding..." : "Add Goal"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setTitle('');
                setCategory('');
                setTargetAmount('');
                setTargetDate(undefined);
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </TiltCard>

      {/* Goals List */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => {
            const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const isCompleted = progress >= 100;
            const remaining = Math.max(0, goal.target_amount - goal.current_amount);

            return (
              <TiltCard key={goal.id} className={cn(
                "shadow-card border-2 transition-all",
                isCompleted ? "border-success bg-success/5" : "border-border"
              )} maxTilt={6}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      {goal.category && (
                        <Badge variant="outline" className="mt-1">
                          {goal.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <Badge className="bg-success">
                          Completed!
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current</p>
                        <p className="font-semibold text-success">{toCurrency(goal.current_amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target</p>
                        <p className="font-semibold">{toCurrency(goal.target_amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className="font-semibold text-warning">{toCurrency(remaining)}</p>
                      </div>
                      {goal.target_date && (
                        <div>
                          <p className="text-muted-foreground">Target Date</p>
                          <p className="font-semibold">{format(new Date(goal.target_date), "MMM dd, yyyy")}</p>
                        </div>
                      )}
                    </div>

                    {!isCompleted && (
                      <div className="flex gap-2">
                        {[500, 1000, 5000].map(amount => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddMoney(goal.id, amount)}
                            className="flex-1"
                          >
                            +₹{amount.toLocaleString()}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </TiltCard>
            );
          })}
        </div>
      ) : (
        <TiltCard className="shadow-card">
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Financial Goals Yet</h3>
            <p className="text-muted-foreground mb-4">
              Set your first financial goal to start tracking your progress toward financial freedom.
            </p>
            <Button 
              onClick={() => (document.querySelector('input[placeholder*="Goal title"]') as HTMLInputElement)?.focus()}
              className="bg-gradient-primary hover:opacity-90"
            >
              Create Your First Goal
            </Button>
          </CardContent>
        </TiltCard>
      )}
    </div>
  );
}