import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  category: string;
  amount: number;
  month: string;
}

const EXPENSE_CATEGORIES = [
  "Food & Dining", "Transportation", "Entertainment", "Healthcare", 
  "Shopping", "Utilities", "Education", "Travel", "Investment", "Other"
];

const toCurrency = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(n);

const csvEscape = (val: string) => `"${val.replace(/"/g, '""')}"`;

const exportCSV = (filename: string, rows: string[][]) => {
  const csvContent = rows.map(row => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function ExpenseTracker() {
  const { toast } = useToast();
  const [salary, setSalary] = useState<string>('');
  const [month, setMonth] = useState<string>('2024-01');
  const [expenseCategory, setExpenseCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const numericSalary = useMemo(() => {
    const parsed = parseFloat(salary);
    return isNaN(parsed) ? 0 : parsed;
  }, [salary]);

  const totals = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netSavings = numericSalary - totalExpenses;
    const savingsPercentage = numericSalary > 0 ? (netSavings / numericSalary) * 100 : 0;
    
    return {
      totalExpenses,
      netSavings,
      savingsPercentage
    };
  }, [expenses, numericSalary]);

  const breakdown = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: numericSalary > 0 ? (amount / numericSalary) * 100 : 0
    }));
  }, [expenses, numericSalary]);

  const addExpense = () => {
    if (!expenseCategory || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please select a category and enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      category: expenseCategory,
      amount: parseFloat(amount),
      month
    };

    setExpenses(prev => [...prev, newExpense]);
    setAmount('');
    toast({
      title: "Expense Added",
      description: `${toCurrency(newExpense.amount)} added to ${newExpense.category}`,
    });
  };

  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
    toast({
      title: "Expense Removed",
      description: "Expense has been deleted.",
    });
  };

  const handleExportCSV = () => {
    const headers = ['Month', 'Category', 'Amount', 'Percentage of Income'];
    const rows = [
      headers,
      ...breakdown.map(item => [
        month,
        item.category,
        item.amount.toString(),
        `${item.percentage.toFixed(2)}%`
      ])
    ];
    exportCSV(`expense-report-${month}.csv`, rows);
  };

  const showTips = totals.savingsPercentage < 30;

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="shadow-card">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Expense
          </CardTitle>
          <CardDescription>Track your monthly expenses and manage your budget</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              type="number"
              placeholder="Annual Salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="focus-visible:ring-primary"
            />
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
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
            <Button onClick={addExpense} className="bg-gradient-primary hover:opacity-90">
              Add Expense
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
                  {toCurrency(totals.netSavings)}
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
                  {totals.savingsPercentage.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={Math.max(0, totals.savingsPercentage)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Table */}
      {expenses.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expense Summary</CardTitle>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>% of Income</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdown.map(item => (
                  <TableRow key={item.category}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell>{toCurrency(item.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.percentage.toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExpense(expenses.find(e => e.category === item.category)?.id || '')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Expense Distribution Chart */}
      {breakdown.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => [toCurrency(Number(value)), 'Amount']} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      {showTips && (
        <Card className="border-warning/50 bg-warning/10 shadow-card">
          <CardHeader>
            <CardTitle className="text-warning">💡 Smart Spending Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Consider reducing discretionary spending to improve your savings rate</li>
              <li>• Aim for at least 20% savings rate for healthy financial goals</li>
              <li>• Review your largest expense categories for potential optimizations</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}