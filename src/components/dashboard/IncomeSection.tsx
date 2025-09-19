import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { IndianRupee, Calculator, Edit, Save } from "lucide-react";

const toCurrency = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(n);

interface IncomeSectionProps {
  annualSalary: number;
  onSalaryChange: (salary: number) => void;
  estimatedTax: number;
  netAnnualIncome: number;
}

export function IncomeSection({ annualSalary, onSalaryChange, estimatedTax, netAnnualIncome }: IncomeSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempSalary, setTempSalary] = useState(annualSalary.toString());

  const handleSave = () => {
    const salary = parseFloat(tempSalary) || 0;
    onSalaryChange(salary);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempSalary(annualSalary.toString());
    setIsEditing(false);
  };

  const getTaxSlab = (income: number): string => {
    if (income <= 400000) return "No Tax (Up to ₹4L)";
    if (income <= 800000) return "5% Tax Slab (₹4L-₹8L)";
    if (income <= 1200000) return "10% Tax Slab (₹8L-₹12L)";
    if (income <= 1600000) return "15% Tax Slab (₹12L-₹16L)";
    if (income <= 2000000) return "20% Tax Slab (₹16L-₹20L)";
    if (income <= 2400000) return "25% Tax Slab (₹20L-₹24L)";
    return "30% Tax Slab (Above ₹24L)";
  };

  return (
    <Card className="shadow-card border-0 bg-gradient-card">
      <CardHeader className="bg-gradient-primary/10 rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Income & Tax Details
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Manage your salary and view tax calculations as per Indian FY 2025-26 slabs
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Annual Salary (₹)</label>
              <Input
                type="number"
                placeholder="Enter your annual salary"
                value={tempSalary}
                onChange={(e) => setTempSalary(e.target.value)}
                className="h-12 text-lg mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Annual Salary</p>
              <p className="text-xl font-bold">{annualSalary > 0 ? toCurrency(annualSalary) : "Not set"}</p>
              {annualSalary > 0 && (
                <Badge variant="outline" className="text-xs">
                  {getTaxSlab(annualSalary)}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Estimated Tax</p>
              <p className="text-xl font-bold text-destructive">{toCurrency(estimatedTax)}</p>
              <p className="text-xs text-muted-foreground">
                {annualSalary > 0 ? `${((estimatedTax / annualSalary) * 100).toFixed(1)}% of income` : ""}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Net Annual Income</p>
              <p className="text-xl font-bold text-success">{toCurrency(netAnnualIncome)}</p>
              <p className="text-xs text-muted-foreground">After tax deduction</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Monthly Take Home</p>
              <p className="text-xl font-bold text-success">{toCurrency(netAnnualIncome / 12)}</p>
              <p className="text-xs text-muted-foreground">Net monthly income</p>
            </div>
          </div>
        )}

        {annualSalary > 0 && !isEditing && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calculator className="h-4 w-4" />
              <span>Tax calculated as per Indian Income Tax slabs FY 2025-26</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}