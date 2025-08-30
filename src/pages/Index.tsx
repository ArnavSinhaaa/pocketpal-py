import { useMemo, useState } from "react";
import AmbientGradient from "@/components/AmbientGradient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Trash2, Download } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";


type Expense = { id: string; category: string; amount: number };

function toCurrency(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(isFinite(n) ? n : 0);
}

function csvEscape(val: string) {
  if (val.includes(",") || val.includes("\n") || val.includes("\"")) {
    return `"${val.replace(/\"/g, '""')}"`;
  }
  return val;
}

function exportCSV(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

const Index = () => {
  const [salary, setSalary] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const numericSalary = useMemo(() => {
    const n = Number(salary);
    return isFinite(n) && n >= 0 ? n : 0;
  }, [salary]);

  const totals = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netSavings = numericSalary - totalExpenses;
    const savingsPct = numericSalary > 0 ? (netSavings / numericSalary) * 100 : 0;
    return { totalExpenses, netSavings, savingsPct };
  }, [expenses, numericSalary]);

  const breakdown = useMemo(() => {
    return expenses.map((e) => ({
      name: e.category || "(uncategorized)",
      amount: e.amount,
      percentOfIncome: numericSalary > 0 ? (e.amount / numericSalary) * 100 : 0,
    }));
  }, [expenses, numericSalary]);

  function addExpense() {
    try {
      if (!category.trim()) throw new Error("Enter a category name.");
      const n = Number(amount);
      if (!isFinite(n) || n <= 0) throw new Error("Enter a valid amount > 0.");
      const item: Expense = { id: crypto.randomUUID(), category: category.trim(), amount: n };
      setExpenses((prev) => [item, ...prev]);
      setCategory("");
      setAmount("");
      toast({ title: "Expense added", description: `${item.category} - ${toCurrency(item.amount)}` });
    } catch (err: any) {
      toast({ title: "Invalid input", description: err.message });
    }
  }

  function removeExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function handleExportCSV() {
    const rows: string[][] = [];
    const heading = ["Month", month || "(unspecified)"];
    rows.push(heading);
    rows.push(["Salary", numericSalary.toString()]);
    rows.push(["Total Expenses", totals.totalExpenses.toString()]);
    rows.push(["Net Savings", totals.netSavings.toString()]);
    rows.push(["Savings %", totals.savingsPct.toFixed(2)]);
    rows.push([]);
    rows.push(["Category", "Amount", "% of Income"]);
    expenses
      .slice()
      .reverse()
      .forEach((e) => rows.push([e.category, e.amount.toString(), ((e.amount / (numericSalary || 1)) * 100).toFixed(2)]));

    exportCSV(`finance-${month || "report"}.csv`, rows);
    toast({ title: "CSV exported", description: "Your report has been downloaded." });
  }

  const showTips = totals.totalExpenses > numericSalary * 0.7 && numericSalary > 0;

  return (
    <div className="relative min-h-screen">
      <AmbientGradient />
      <header className="container mx-auto pt-10 pb-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Personal Finance Manager</h1>
        <p className="mt-2 text-muted-foreground max-w-prose">
          Track salary, add expenses, view charts, and export a CSV report.
        </p>
      </header>

      <main className="container mx-auto pb-16">
        <section aria-labelledby="inputs" className="grid gap-6 md:grid-cols-2">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="month">Month (optional)</Label>
                <Input id="month" placeholder="e.g. 2025-08" value={month} onChange={(e) => setMonth(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salary">Monthly Salary</Label>
                <Input
                  id="salary"
                  inputMode="decimal"
                  placeholder="Enter salary"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                />
              </div>
              <Separator />
              <div className="grid md:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="category">Expense Category</Label>
                  <Input id="category" placeholder="e.g. Rent" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" inputMode="decimal" placeholder="e.g. 1200" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={addExpense}>Add Expense</Button>
                <Button variant="secondary" onClick={() => { setCategory(""); setAmount(""); }}>Clear</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><span>Total Income</span><span className="font-semibold">{toCurrency(numericSalary)}</span></div>
              <div className="flex items-center justify-between"><span>Total Expenses</span><span className="font-semibold">{toCurrency(totals.totalExpenses)}</span></div>
              <div className="flex items-center justify-between"><span>Net Savings</span><span className="font-semibold">{toCurrency(totals.netSavings)}</span></div>
              <div className="flex items-center justify-between"><span>Savings %</span><span className="font-semibold">{isFinite(totals.savingsPct) ? totals.savingsPct.toFixed(2) + "%" : "-"}</span></div>
              <div className="pt-3">
                <Button onClick={handleExportCSV} className="w-full"><Download className="mr-2 h-4 w-4" />Export CSV</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="table" className="mt-8 grid gap-6 md:grid-cols-5">
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Expense Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">% of Salary</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">No expenses yet. Add your first above.</TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>{e.category}</TableCell>
                          <TableCell className="text-right">{toCurrency(e.amount)}</TableCell>
                          <TableCell className="text-right">{numericSalary > 0 ? ((e.amount / numericSalary) * 100).toFixed(2) + "%" : "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" onClick={() => removeExpense(e.id)} aria-label={`Remove ${e.category}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Expense Distribution</CardTitle>
            </CardHeader>
            <CardContent style={{ height: 320 }}>
              {expenses.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">Add expenses to see the chart</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdown}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip formatter={(v: any, n) => (n === "amount" ? toCurrency(Number(v)) : `${Number(v).toFixed(2)}%`)} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </section>

        {showTips && (
          <section className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Spending Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Your expenses exceed 70% of your income. Consider:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Set a target to save at least 20% by reducing variable costs (dining, subscriptions).</li>
                  <li>Negotiate recurring bills (rent, internet, insurance) or look for cheaper alternatives.</li>
                  <li>Automate savings on payday to “pay yourself first.”</li>
                </ul>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;
