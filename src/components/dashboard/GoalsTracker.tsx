import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Target, TrendingUp, Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date | null;
  category: string;
  isCompleted: boolean;
}

const toCurrency = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(n);

export function GoalsTracker() {
  const { toast } = useToast();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [category, setCategory] = useState('Savings');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate(undefined);
    setCategory('Savings');
    setShowForm(false);
    setEditingGoal(null);
  };

  const handleSubmit = () => {
    if (!title || !targetAmount || parseFloat(targetAmount) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    const goalData = {
      title,
      description,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      targetDate,
      category,
      isCompleted: false
    };

    if (editingGoal) {
      setGoals(prev => prev.map(goal => 
        goal.id === editingGoal 
          ? { ...goal, ...goalData }
          : goal
      ));
      toast({
        title: "Goal Updated",
        description: "Your financial goal has been updated successfully.",
      });
    } else {
      const newGoal: FinancialGoal = {
        id: crypto.randomUUID(),
        ...goalData
      };
      setGoals(prev => [...prev, newGoal]);
      toast({
        title: "Goal Created",
        description: "New financial goal has been added to your tracker.",
      });
    }

    resetForm();
  };

  const updateProgress = (goalId: string, amount: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const newAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
        const isCompleted = newAmount >= goal.targetAmount;
        return { ...goal, currentAmount: newAmount, isCompleted };
      }
      return goal;
    }));
    
    toast({
      title: "Progress Updated",
      description: `Added ${toCurrency(amount)} to your goal.`,
    });
  };

  const editGoal = (goal: FinancialGoal) => {
    setTitle(goal.title);
    setDescription(goal.description);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setTargetDate(goal.targetDate || undefined);
    setCategory(goal.category);
    setEditingGoal(goal.id);
    setShowForm(true);
  };

  const deleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
    toast({
      title: "Goal Deleted",
      description: "Financial goal has been removed.",
    });
  };

  const completedGoals = goals.filter(goal => goal.isCompleted).length;
  const totalGoalsValue = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
                <p className="text-2xl font-bold">{goals.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{completedGoals}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Saved</p>
                <p className="text-2xl font-bold text-primary">{toCurrency(totalSaved)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Goal Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Financial Goals</h2>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-primary hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Goal Form */}
      {showForm && (
        <Card className="shadow-card border-primary/20">
          <CardHeader>
            <CardTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</CardTitle>
            <CardDescription>Set up your financial target and track your progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Goal title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                placeholder="Category (e.g., Vacation, Emergency Fund)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="number"
                placeholder="Target Amount"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Current Amount"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "PPP") : "Target Date"}
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
            
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="bg-gradient-primary hover:opacity-90">
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
              <Button onClick={resetForm} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      <div className="grid gap-4">
        {goals.map(goal => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const isOverdue = goal.targetDate && new Date() > goal.targetDate && !goal.isCompleted;
          
          return (
            <Card key={goal.id} className={`shadow-card ${goal.isCompleted ? 'border-success/50 bg-success/5' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {goal.title}
                      {goal.isCompleted && <CheckCircle className="h-5 w-5 text-success" />}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{goal.category}</Badge>
                      {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                      {goal.targetDate && (
                        <Badge variant="secondary">
                          Due: {format(goal.targetDate, "MMM dd, yyyy")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => editGoal(goal)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {goal.description && (
                  <CardDescription>{goal.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{toCurrency(goal.currentAmount)} of {toCurrency(goal.targetAmount)}</span>
                    <span className="font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                {!goal.isCompleted && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Add amount"
                      className="max-w-32"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          const amount = parseFloat(input.value);
                          if (amount > 0) {
                            updateProgress(goal.id, amount);
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                        const amount = parseFloat(input.value);
                        if (amount > 0) {
                          updateProgress(goal.id, amount);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {goals.length === 0 && !showForm && (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Financial Goals Yet</h3>
            <p className="text-muted-foreground mb-4">Start setting financial goals to track your progress</p>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}