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

const incomeTypeCategories = [
  {
    category: "Investment Income",
    types: [
      { value: "Interest Income", label: "Interest Income", hint: "Bank FD, Savings A/c" },
      { value: "Dividend Income", label: "Dividend Income", hint: "Equity Dividends" },
    ]
  },
  {
    category: "Capital Gains",
    types: [
      { value: "Short-term Capital Gains (STCG) - Equity", label: "STCG - Equity", hint: "15% flat tax" },
      { value: "Long-term Capital Gains (LTCG) - Equity", label: "LTCG - Equity", hint: "10% above ₹1L" },
      { value: "STCG - Other Assets", label: "STCG - Other Assets", hint: "20% flat tax" },
      { value: "LTCG - Other Assets", label: "LTCG - Other Assets", hint: "20% with indexation" },
    ]
  },
  {
    category: "Business & Professional",
    types: [
      { value: "Freelance/Consulting", label: "Freelance/Consulting", hint: "Professional services" },
      { value: "Business Income", label: "Business Income", hint: "Trade or business" },
      { value: "Commission Income", label: "Commission Income", hint: "Agent commissions" },
      { value: "Royalty Income", label: "Royalty Income", hint: "IP, patents, content" },
    ]
  },
  {
    category: "Other Income",
    types: [
      { value: "Rental Income", label: "Rental Income", hint: "30% std deduction" },
      { value: "Winnings/Lottery", label: "Winnings/Lottery", hint: "30% TDS" },
      { value: "Gift Income", label: "Gift Income", hint: "Exempt up to ₹50k" },
      { value: "Agricultural Income", label: "Agricultural Income", hint: "Tax exempt" },
      { value: "Others", label: "Others", hint: "Other sources" },
    ]
  }
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

  // Calculate estimated tax based on income type (these are standalone rates, not part of progressive calculation)
  const calculateTaxByType = (incomeType: string, amount: number): number => {
    switch (incomeType) {
      case "Short-term Capital Gains (STCG) - Equity":
        return amount * 0.15; // 15% flat
      case "Long-term Capital Gains (LTCG) - Equity":
        return Math.max(0, amount - 100000) * 0.10; // 10% above ₹1L exemption
      case "STCG - Other Assets":
        return amount * 0.20; // 20% flat
      case "LTCG - Other Assets":
        return amount * 0.20; // 20% with indexation benefit
      case "Rental Income":
        // 30% standard deduction, remaining taxed at slab rate (simplified to 30%)
        const netRental = amount * 0.70;
        return netRental * 0.30;
      case "Winnings/Lottery":
        return amount * 0.30; // 30% flat TDS
      case "Agricultural Income":
        return 0; // Fully tax-exempt
      case "Gift Income":
        // Gifts above ₹50k are taxable at slab rate (simplified to 30%)
        return amount > 50000 ? (amount - 50000) * 0.30 : 0;
      default:
        // Interest, Dividends, Freelance, Business, Commission, Royalty, Others
        // Taxed at slab rate (estimated at 30% for simplification)
        return amount * 0.30;
    }
  };

  const totalIndirectIncome = sources.reduce((sum, source) => {
    return sum + calculateAnnualAmount(Number(source.amount), source.frequency);
  }, 0);

  const estimatedTax = sources.reduce((sum, source) => {
    const annualAmount = calculateAnnualAmount(Number(source.amount), source.frequency);
    return sum + calculateTaxByType(source.income_type, annualAmount);
  }, 0);

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
                <p className="text-xs text-muted-foreground">{sources.length} source(s)</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Estimated Tax</p>
                <p className="text-2xl font-bold text-destructive">{toCurrency(estimatedTax)}</p>
                <p className="text-xs text-muted-foreground">Category-based rates</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Net Indirect Income</p>
                <p className="text-2xl font-bold text-success">{toCurrency(netIndirectIncome)}</p>
                <p className="text-xs text-muted-foreground">After tax deduction</p>
              </div>
            </div>

            {/* Add New Source Form */}
            <div className="space-y-4 p-5 border border-border/50 rounded-lg bg-background/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Add New Income Source</h3>
                <span className="text-xs text-muted-foreground">All fields required</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Income Type Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Income Type</label>
                  <Select
                    value={newSource.income_type}
                    onValueChange={(value) => setNewSource({ ...newSource, income_type: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select income category" />
                    </SelectTrigger>
                    <SelectContent>
                      {incomeTypeCategories.map((category) => (
                        <div key={category.category}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {category.category}
                          </div>
                          {category.types.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center justify-between w-full">
                                <span>{type.label}</span>
                                <span className="text-xs text-muted-foreground ml-2">{type.hint}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Amount (₹)</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={newSource.amount}
                    onChange={(e) => setNewSource({ ...newSource, amount: e.target.value })}
                    className="h-10"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Frequency Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Payment Frequency</label>
                  <Select
                    value={newSource.frequency}
                    onValueChange={(value) => setNewSource({ ...newSource, frequency: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Add Button */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground opacity-0">Action</label>
                  <Button 
                    onClick={handleAddSource} 
                    className="h-10 w-full bg-gradient-primary hover:opacity-90"
                    disabled={!newSource.income_type || !newSource.amount || parseFloat(newSource.amount) <= 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Income Source
                  </Button>
                </div>
              </div>
              
              {/* Helper text */}
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-primary"></span>
                Tax calculations are estimates. For LTCG Equity, ₹1L exemption is automatically applied.
              </p>
            </div>

            {/* Sources List */}
            {sources.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Your Income Sources</h3>
                {sources.map((source) => {
                  const annualAmount = calculateAnnualAmount(Number(source.amount), source.frequency);
                  const taxOnThis = calculateTaxByType(source.income_type, annualAmount);
                  const netAmount = annualAmount - taxOnThis;

                  return (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-medium text-sm">{source.income_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="font-medium">{toCurrency(Number(source.amount))} / {source.frequency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Annual / Tax</p>
                          <p className="font-medium text-primary">{toCurrency(annualAmount)}</p>
                          <p className="text-xs text-destructive">Tax: {toCurrency(taxOnThis)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Net Annual</p>
                          <p className="font-medium text-success">{toCurrency(netAmount)}</p>
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
                  );
                })}
              </div>
            )}

            {sources.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground">No indirect income sources added yet</p>
                <p className="text-xs text-muted-foreground">Add your first income source using the form above</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}