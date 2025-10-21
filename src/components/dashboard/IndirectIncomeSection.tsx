import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { useIndirectIncome } from "@/hooks/useIndirectIncome";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const toCurrency = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(n);

const incomeTypes = [
  "Interest",
  "Dividends",
  "Freelance",
  "Rent",
  "Capital Gains",
  "Others"
];

const frequencies = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" }
];

interface IndirectIncomeSectionProps {
  onTotalChange: (total: number) => void;
}

export function IndirectIncomeSection({ onTotalChange }: IndirectIncomeSectionProps) {
  const { sources, loading, addSource, deleteSource } = useIndirectIncome();
  const [isOpen, setIsOpen] = useState(false);
  const [newSource, setNewSource] = useState({
    income_type: "",
    amount: "",
    frequency: "monthly"
  });

  const calculateAnnualAmount = (amount: number, frequency: string): number => {
    switch (frequency) {
      case "monthly": return amount * 12;
      case "quarterly": return amount * 4;
      case "annually": return amount;
      default: return amount;
    }
  };

  const totalIndirectIncome = sources.reduce((sum, source) => {
    return sum + calculateAnnualAmount(Number(source.amount), source.frequency);
  }, 0);

  const estimatedTax = totalIndirectIncome * 0.30; // Simplified 30% tax
  const netIndirectIncome = totalIndirectIncome - estimatedTax;

  // Notify parent component of total change
  useEffect(() => {
    onTotalChange(totalIndirectIncome);
  }, [totalIndirectIncome, onTotalChange]);

  const handleAddSource = async () => {
    if (!newSource.income_type || !newSource.amount) return;

    const result = await addSource({
      income_type: newSource.income_type,
      amount: parseFloat(newSource.amount),
      frequency: newSource.frequency
    });

    if (result.success) {
      setNewSource({ income_type: "", amount: "", frequency: "monthly" });
    }
  };

  const handleDeleteSource = async (id: string, amount: number, frequency: string) => {
    await deleteSource(id);
  };

  return (
    <Card className="shadow-card border-0 bg-gradient-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="bg-gradient-primary/10 rounded-t-lg">
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Indirect Income Sources
              </CardTitle>
              <CardDescription>
                Track additional income from investments, freelancing, and other sources
              </CardDescription>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Indirect Income</p>
                <p className="text-2xl font-bold text-primary">{toCurrency(totalIndirectIncome)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Estimated Tax (30%)</p>
                <p className="text-2xl font-bold text-destructive">{toCurrency(estimatedTax)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Net Indirect Income</p>
                <p className="text-2xl font-bold text-success">{toCurrency(netIndirectIncome)}</p>
              </div>
            </div>

            {/* Add New Source Form */}
            <div className="space-y-4 p-4 border border-border/50 rounded-lg bg-background/50">
              <h3 className="text-sm font-semibold">Add Income Source</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Select
                  value={newSource.income_type}
                  onValueChange={(value) => setNewSource({ ...newSource, income_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Income Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="Amount (₹)"
                  value={newSource.amount}
                  onChange={(e) => setNewSource({ ...newSource, amount: e.target.value })}
                />

                <Select
                  value={newSource.frequency}
                  onValueChange={(value) => setNewSource({ ...newSource, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={handleAddSource} className="bg-gradient-primary hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              </div>
            </div>

            {/* Sources List */}
            {sources.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Your Income Sources</h3>
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium">{source.income_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="font-medium">{toCurrency(Number(source.amount))} / {source.frequency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Annual Value</p>
                        <p className="font-medium text-primary">
                          {toCurrency(calculateAnnualAmount(Number(source.amount), source.frequency))}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSource(source.id, Number(source.amount), source.frequency)}
                      className="ml-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {sources.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No indirect income sources added yet. Click "Add Source" to get started.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}