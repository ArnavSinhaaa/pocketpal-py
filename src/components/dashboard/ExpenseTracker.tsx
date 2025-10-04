import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, TrendingUp, TrendingDown, AlertCircle, IndianRupee, Calculator, PieChart, Edit } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useProfile } from "@/hooks/useProfile";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { IncomeSection } from "./IncomeSection";
import { ExpensePieChart } from "./ExpensePieChart";
import { CategoryManager } from "./CategoryManager";


// Indian Tax Slabs for FY 2025-26
const calculateIncomeTax = (annualIncome: number): number => {
  if (annualIncome <= 400000) return 0;
  if (annualIncome <= 800000) return (annualIncome - 400000) * 0.05;
  if (annualIncome <= 1200000) return 20000 + (annualIncome - 800000) * 0.10;
  if (annualIncome <= 1600000) return 60000 + (annualIncome - 1200000) * 0.15;
  if (annualIncome <= 2000000) return 120000 + (annualIncome - 1600000) * 0.20;
  if (annualIncome <= 2400000) return 200000 + (annualIncome - 2000000) * 0.25;
  return 300000 + (annualIncome - 2400000) * 0.30;
};

const toCurrency = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(n);

export function ExpenseTracker() {
  const [expenseCategory, setExpenseCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { expenses, loading, addExpense, removeExpense } = useExpenses();
  const { profile, loading: profileLoading, updateSalary } = useProfile();
  const { getAllCategories, loading: categoriesLoading } = useExpenseCategories();
  
  const allCategories = getAllCategories();
  const annualSalary = profile?.annual_salary || 0;

  const financialData = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const estimatedTax = calculateIncomeTax(annualSalary);
    const netAnnualIncome = annualSalary - estimatedTax;
    const monthlyNetIncome = netAnnualIncome / 12;
    const netSavings = monthlyNetIncome - totalExpenses;
    const savingsPercentage = monthlyNetIncome > 0 ? (netSavings / monthlyNetIncome) * 100 : 0;
    
    return { 
      totalExpenses, 
      netSavings, 
      savingsPercentage, 
      monthlyNetIncome,
      estimatedTax,
      netAnnualIncome,
      taxableIncome: annualSalary
    };
  }, [expenses, annualSalary]);

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Income Section */}
      <IncomeSection 
        annualSalary={annualSalary}
        onSalaryChange={updateSalary}
        estimatedTax={financialData.estimatedTax}
        netAnnualIncome={financialData.netAnnualIncome}
      />

      {/* Quick Expense Entry */}
      <Card className="shadow-card border-0 bg-gradient-card">
        <CardHeader className="bg-gradient-primary/10 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Expense
              </CardTitle>
              <CardDescription>Quick and easy expense tracking</CardDescription>
            </div>
            <CategoryManager />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select value={expenseCategory} onValueChange={setExpenseCategory}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {allCategories.map((cat: any) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    <div className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      {!cat.isDefault && (
                        <Badge variant="secondary" className="text-xs ml-1">Custom</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 text-lg focus-visible:ring-primary"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleAddExpense} 
                className="bg-gradient-primary hover:opacity-90 flex-1 h-12"
                disabled={isSubmitting || !expenseCategory || !amount}
              >
                {isSubmitting ? "Adding..." : "Add Expense"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {setAmount(''); setExpenseCategory('');}}
                className="h-12 px-3"
              >
                Clear
              </Button>
            </div>
          </div>
          
          {/* Quick Add Categories */}
          <div className="flex flex-wrap gap-2">
            {allCategories.slice(0, 5).map((cat: any) => (
              <Button
                key={cat.name}
                variant="ghost"
                size="sm"
                onClick={() => setExpenseCategory(cat.name)}
                className="text-xs"
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Financial Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Net Income</p>
                  <p className="text-2xl font-bold text-success">{toCurrency(financialData.monthlyNetIncome)}</p>
                  <p className="text-xs text-muted-foreground">After tax deduction</p>
                </div>
                <IndianRupee className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-destructive">{toCurrency(financialData.totalExpenses)}</p>
                  <p className="text-xs text-muted-foreground">This month</p>
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
                  <p className={`text-2xl font-bold ${financialData.netSavings >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {annualSalary > 0 ? toCurrency(financialData.netSavings) : "Set salary first"}
                  </p>
                  <p className="text-xs text-muted-foreground">Monthly remainder</p>
                </div>
                <TrendingDown className={`h-8 w-8 ${financialData.netSavings >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Savings Rate</p>
                  <p className={`text-2xl font-bold ${financialData.savingsPercentage >= 20 ? 'text-success' : 'text-warning'}`}>
                    {annualSalary > 0 ? `${financialData.savingsPercentage.toFixed(1)}%` : "0.0%"}
                  </p>
                  <p className="text-xs text-muted-foreground">Target: 20%+</p>
                </div>
                <Badge variant={financialData.savingsPercentage >= 20 ? "default" : "destructive"}>
                  {financialData.savingsPercentage >= 20 ? "Good" : "Improve"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expense Breakdown Chart */}
        <div className="lg:col-span-1">
          <Card className="shadow-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExpensePieChart expenses={expenses} />
            </CardContent>
          </Card>
        </div>
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