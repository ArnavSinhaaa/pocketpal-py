import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { CalendarIcon, Plus, Bell, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
import { useBills } from "@/hooks/useBills";
import { cn } from "@/lib/utils";

const toCurrency = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(n);

const BILL_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'one-time', label: 'One-time' }
];

export function BillReminders() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [dueDate, setDueDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { bills, loading, addBill, markAsPaid, removeBill } = useBills();

  const handleAddBill = async () => {
    if (!title || !amount || !dueDate || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);
    const result = await addBill({
      title,
      amount: parseFloat(amount),
      frequency,
      due_date: dueDate.toISOString().split('T')[0]
    });

    if (result?.success) {
      setTitle('');
      setAmount('');
      setFrequency('monthly');
      setDueDate(undefined);
    }
    setIsSubmitting(false);
  };

  const getBillStatus = (bill: any) => {
    if (bill.is_paid) return 'paid';
    
    const today = new Date();
    const due = new Date(bill.due_date);
    const threeDaysFromNow = addDays(today, 3);
    
    if (isBefore(due, today)) return 'overdue';
    if (isBefore(due, threeDaysFromNow)) return 'due-soon';
    return 'upcoming';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success">Paid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'due-soon':
        return <Badge className="bg-warning text-warning-foreground">Due Soon</Badge>;
      default:
        return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'due-soon':
        return <Bell className="h-5 w-5 text-warning" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedBills = bills.reduce((acc, bill) => {
    const status = getBillStatus(bill);
    if (!acc[status]) acc[status] = [];
    acc[status].push(bill);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {/* Add Bill Section */}
      <Card className="shadow-card border-0 bg-gradient-card">
        <CardHeader className="bg-gradient-primary/10 rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Add Bill Reminder
          </CardTitle>
          <CardDescription>Never miss a payment with smart reminders</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Bill name (e.g., Electricity)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="lg:col-span-2"
            />
            <Input
              type="number"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BILL_FREQUENCIES.map(freq => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "MMM dd") : "Due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={handleAddBill}
              className="bg-gradient-primary hover:opacity-90"
              disabled={isSubmitting || !title || !amount || !dueDate}
            >
              {isSubmitting ? "Adding..." : "Add Bill"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setTitle('');
                setAmount('');
                setFrequency('monthly');
                setDueDate(undefined);
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bills by Status */}
      {['overdue', 'due-soon', 'upcoming', 'paid'].map(status => {
        const statusBills = groupedBills[status] || [];
        if (statusBills.length === 0) return null;

        const statusTitle = {
          overdue: 'Overdue Bills',
          'due-soon': 'Due Soon',
          upcoming: 'Upcoming Bills',
          paid: 'Paid Bills'
        }[status];

        return (
          <Card key={status} className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">{statusTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusBills.map(bill => (
                  <div key={bill.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      <div>
                        <h4 className="font-medium">{bill.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Due: {format(new Date(bill.due_date), "MMM dd, yyyy")} • {bill.frequency}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">{toCurrency(bill.amount)}</p>
                        {getStatusBadge(status)}
                      </div>
                      
                      <div className="flex gap-1">
                        {!bill.is_paid && (
                          <Button
                            size="sm"
                            onClick={() => markAsPaid(bill.id)}
                            className="bg-success hover:bg-success/90"
                          >
                            Mark Paid
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBill(bill.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {bills.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Bill Reminders Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first bill reminder to never miss a payment again.
            </p>
            <Button 
              onClick={() => (document.querySelector('input[placeholder*="Bill name"]') as HTMLInputElement)?.focus()}
              className="bg-gradient-primary hover:opacity-90"
            >
              Add Your First Bill
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}