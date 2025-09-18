import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";

const EXPENSE_CATEGORIES = [
  "Food & Dining", "Transportation", "Entertainment", "Healthcare", 
  "Shopping", "Utilities", "Education", "Travel", "Investment", "Other"
];

const toCurrency = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(n);

export function ExpenseTracker() {
  const [salary, setSalary] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { expenses, loading, addExpense, removeExpense } = useExpenses();

  const numericSalary = useMemo(() => {
    const parsed = parseFloat(salary);
    return isNaN(parsed) ? 0 : parsed;
  }, [salary]);

  const totals = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthlyIncome = numericSalary / 12;
    const netSavings = monthlyIncome - totalExpenses;
    const savingsPercentage = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;
    
    return { totalExpenses, netSavings, savingsPercentage, monthlyIncome };
  }, [expenses, numericSalary]);

  const handleAddExpense = async () => {
    if (!expenseCategory || !amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);
    const result = await addExpense({
      category: expenseCategory,
      amount: parseFloat(amount),
    });

    if (result?.success) {
      setAmount('');
      setExpenseCategory('');
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="shadow-card border-0 bg-gradient-card">
        <CardHeader className="bg-gradient-primary/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Expense
          </CardTitle>
          <CardDescription>Track your expenses and manage your budget</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              type="number"
              placeholder="Annual Salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="focus-visible:ring-primary"
            />
            <Select value={expenseCategory} onValueChange={setExpenseCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="focus-visible:ring-primary"
            />
            <Button 
              onClick={handleAddExpense} 
              className="bg-gradient-primary hover:opacity-90"
              disabled={isSubmitting || !expenseCategory || !amount}
            >
              {isSubmitting ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">{toCurrency(totals.totalExpenses)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Savings</p>
                <p className={`text-2xl font-bold ${totals.netSavings >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {totals.monthlyIncome > 0 ? toCurrency(totals.netSavings) : "Set salary"}
                </p>
              </div>
              <TrendingDown className={`h-8 w-8 ${totals.netSavings >= 0 ? 'text-success' : 'text-destructive'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Savings Rate</p>
                <Badge variant={totals.savingsPercentage >= 20 ? "default" : "destructive"}>
                  {totals.monthlyIncome > 0 ? `${totals.savingsPercentage.toFixed(1)}%` : "Set salary"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      {expenses.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenses.slice(0, 10).map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{expense.category}</p>
                    <p className="text-sm text-muted-foreground">{expense.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{toCurrency(expense.amount)}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}