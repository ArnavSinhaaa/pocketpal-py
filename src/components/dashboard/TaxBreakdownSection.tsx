import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calculator, ChevronDown, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const toCurrency = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(n);

interface TaxSlab {
  min: number;
  max: number | null;
  rate: number;
  label: string;
}

const taxSlabs: TaxSlab[] = [
  { min: 0, max: 300000, rate: 0, label: "₹0 - ₹3L" },
  { min: 300000, max: 600000, rate: 0.05, label: "₹3L - ₹6L" },
  { min: 600000, max: 900000, rate: 0.10, label: "₹6L - ₹9L" },
  { min: 900000, max: 1200000, rate: 0.15, label: "₹9L - ₹12L" },
  { min: 1200000, max: 1500000, rate: 0.20, label: "₹12L - ₹15L" },
  { min: 1500000, max: null, rate: 0.30, label: "₹15L+" },
];

interface TaxBreakdownSectionProps {
  salaryIncome: number;
  indirectIncome: number;
}

export function TaxBreakdownSection({ salaryIncome, indirectIncome }: TaxBreakdownSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const calculateTaxForIncome = (income: number): number => {
    let tax = 0;
    let remainingIncome = income;

    for (const slab of taxSlabs) {
      if (remainingIncome <= 0) break;

      const slabMax = slab.max || Infinity;
      const taxableInSlab = Math.min(remainingIncome, slabMax - slab.min);

      if (taxableInSlab > 0) {
        tax += taxableInSlab * slab.rate;
        remainingIncome -= taxableInSlab;
      }
    }

    return tax;
  };

  const taxOnSalary = calculateTaxForIncome(salaryIncome);
  const taxOnIndirect = calculateTaxForIncome(indirectIncome);
  const totalTaxableIncome = salaryIncome + indirectIncome;
  const totalTax = taxOnSalary + taxOnIndirect;
  const netAnnualIncome = totalTaxableIncome - totalTax;

  const getApplicableSlab = (income: number): string => {
    for (let i = taxSlabs.length - 1; i >= 0; i--) {
      const slab = taxSlabs[i];
      if (income > slab.min) {
        return `${slab.rate * 100}% (${slab.label})`;
      }
    }
    return "0% (₹0 - ₹3L)";
  };

  return (
    <Card className="shadow-card border-0 bg-gradient-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="bg-gradient-primary/10 rounded-t-lg">
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Detailed Tax Breakdown
                </CardTitle>
                <CardDescription>
                  Indian Income Tax calculations for FY 2025–26
                </CardDescription>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Taxable Income</p>
                <p className="text-xl font-bold">{toCurrency(totalTaxableIncome)}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {getApplicableSlab(totalTaxableIncome)}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tax on Salary</p>
                <p className="text-xl font-bold text-destructive">{toCurrency(taxOnSalary)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tax on Indirect Income</p>
                <p className="text-xl font-bold text-destructive">{toCurrency(taxOnIndirect)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Tax Payable</p>
                <p className="text-xl font-bold text-destructive">{toCurrency(totalTax)}</p>
              </div>
            </div>

            {/* Net Income After Tax */}
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Annual Income (After Total Tax)</p>
                  <p className="text-3xl font-bold text-success mt-1">{toCurrency(netAnnualIncome)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Monthly Take Home</p>
                  <p className="text-2xl font-bold text-success mt-1">{toCurrency(netAnnualIncome / 12)}</p>
                </div>
              </div>
            </div>

            {/* Tax Slabs Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                Income Tax Slabs (FY 2025–26)
                <span className="text-xs text-muted-foreground font-normal">New Tax Regime</span>
              </h3>
              <div className="border border-border/50 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Income Range</TableHead>
                      <TableHead className="text-center">Tax Rate</TableHead>
                      <TableHead className="text-right">Your Tax in This Slab</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxSlabs.map((slab, index) => {
                      const slabMax = slab.max || totalTaxableIncome;
                      const taxableInSlab = Math.max(0, Math.min(totalTaxableIncome - slab.min, slabMax - slab.min));
                      const taxInSlab = taxableInSlab * slab.rate;
                      const isApplicable = taxableInSlab > 0;

                      return (
                        <TableRow 
                          key={index} 
                          className={isApplicable ? "bg-primary/5" : ""}
                        >
                          <TableCell className="font-medium">{slab.label}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={isApplicable ? "default" : "outline"}>
                              {slab.rate * 100}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {isApplicable ? (
                              <span className="text-destructive">{toCurrency(taxInSlab)}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Calculations based on the new tax regime without any deductions under Section 80C, 80D, etc.
              </p>
            </div>

            {/* Income Type Tax Rates Guide */}
            <div className="space-y-3 p-4 border border-border/50 rounded-lg bg-muted/10">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4" />
                Tax Rates by Income Category
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest, Dividends, Freelance:</span>
                    <Badge variant="outline" className="text-xs">Slab Rate</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">STCG - Equity:</span>
                    <Badge variant="outline" className="text-xs">15% Flat</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LTCG - Equity (above ₹1L):</span>
                    <Badge variant="outline" className="text-xs">10%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">STCG/LTCG - Other Assets:</span>
                    <Badge variant="outline" className="text-xs">20%</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rental Income:</span>
                    <Badge variant="outline" className="text-xs">30% Deduction</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Winnings/Lottery:</span>
                    <Badge variant="outline" className="text-xs">30% TDS</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agricultural Income:</span>
                    <Badge variant="outline" className="text-xs bg-success/20">Tax Exempt</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gift (above ₹50k):</span>
                    <Badge variant="outline" className="text-xs">Slab Rate</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}