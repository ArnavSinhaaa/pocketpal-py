import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Expense } from "@/hooks/useExpenses";

interface ExpensePieChartProps {
  expenses: Expense[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--success))'
];

const toCurrency = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(n);

export function ExpensePieChart({ expenses }: ExpensePieChartProps) {
  const chartData = useMemo(() => {
    if (expenses.length === 0) return [];

    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        percentage: 0 // Will be calculated after sorting
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Show top 8 categories
  }, [expenses]);

  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // Add percentage calculation
  const dataWithPercentage = chartData.map(item => ({
    ...item,
    percentage: totalAmount > 0 ? (item.value / totalAmount) * 100 : 0
  }));

  if (expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No expenses yet</p>
          <p className="text-xs mt-1">Add some expenses to see breakdown</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {toCurrency(data.value)} ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithPercentage}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-6 grid grid-cols-1 gap-2">
        {dataWithPercentage.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm font-medium truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm font-semibold">{toCurrency(item.value)}</span>
              <span className="text-sm text-muted-foreground min-w-[3rem] text-right">{item.percentage.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}