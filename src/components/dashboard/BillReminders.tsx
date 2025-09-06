import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Bell, AlertTriangle, CheckCircle, Plus, Edit, Trash2 } from "lucide-react";
import { format, isAfter, isBefore, addDays, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface BillReminder {
  id: string;
  title: string;
  amount: number;
  dueDate: Date;
  frequency: 'monthly' | 'weekly' | 'yearly' | 'one-time';
  category: string;
  isPaid: boolean;
  reminderDays: number;
}

const BILL_CATEGORIES = [
  "Utilities", "Rent/Mortgage", "Insurance", "Subscriptions", 
  "Credit Card", "Loan", "Internet", "Phone", "Other"
];

const FREQUENCIES = [
  { value: 'one-time', label: 'One Time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

const toCurrency = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(n);

export function BillReminders() {
  const { toast } = useToast();
  const [bills, setBills] = useState<BillReminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [frequency, setFrequency] = useState<string>('monthly');
  const [category, setCategory] = useState('');
  const [reminderDays, setReminderDays] = useState('3');

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setDueDate(undefined);
    setFrequency('monthly');
    setCategory('');
    setReminderDays('3');
    setShowForm(false);
    setEditingBill(null);
  };

  const handleSubmit = () => {
    if (!title || !amount || !dueDate || !category || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    const billData = {
      title,
      amount: parseFloat(amount),
      dueDate,
      frequency: frequency as BillReminder['frequency'],
      category,
      reminderDays: parseInt(reminderDays),
      isPaid: false
    };

    if (editingBill) {
      setBills(prev => prev.map(bill => 
        bill.id === editingBill 
          ? { ...bill, ...billData }
          : bill
      ));
      toast({
        title: "Bill Updated",
        description: "Bill reminder has been updated successfully.",
      });
    } else {
      const newBill: BillReminder = {
        id: crypto.randomUUID(),
        ...billData
      };
      setBills(prev => [...prev, newBill]);
      toast({
        title: "Bill Added",
        description: "New bill reminder has been created.",
      });
    }

    resetForm();
  };

  const markAsPaid = (billId: string) => {
    setBills(prev => prev.map(bill => 
      bill.id === billId 
        ? { ...bill, isPaid: true }
        : bill
    ));
    toast({
      title: "Bill Marked as Paid",
      description: "Bill has been marked as paid for this cycle.",
    });
  };

  const editBill = (bill: BillReminder) => {
    setTitle(bill.title);
    setAmount(bill.amount.toString());
    setDueDate(bill.dueDate);
    setFrequency(bill.frequency);
    setCategory(bill.category);
    setReminderDays(bill.reminderDays.toString());
    setEditingBill(bill.id);
    setShowForm(true);
  };

  const deleteBill = (billId: string) => {
    setBills(prev => prev.filter(bill => bill.id !== billId));
    toast({
      title: "Bill Deleted",
      description: "Bill reminder has been removed.",
    });
  };

  const billsWithStatus = useMemo(() => {
    const today = new Date();
    
    return bills.map(bill => {
      const daysUntilDue = differenceInDays(bill.dueDate, today);
      const isOverdue = daysUntilDue < 0 && !bill.isPaid;
      const isDueSoon = daysUntilDue <= bill.reminderDays && daysUntilDue >= 0 && !bill.isPaid;
      const isUpcoming = daysUntilDue > bill.reminderDays && !bill.isPaid;
      
      let status: 'overdue' | 'due-soon' | 'upcoming' | 'paid' = 'upcoming';
      if (bill.isPaid) status = 'paid';
      else if (isOverdue) status = 'overdue';
      else if (isDueSoon) status = 'due-soon';
      
      return { ...bill, status, daysUntilDue };
    }).sort((a, b) => {
      // Sort by status priority, then by due date
      const statusPriority = { overdue: 0, 'due-soon': 1, upcoming: 2, paid: 3 };
      if (statusPriority[a.status] !== statusPriority[b.status]) {
        return statusPriority[a.status] - statusPriority[b.status];
      }
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }, [bills]);

  const overdueBills = billsWithStatus.filter(bill => bill.status === 'overdue').length;
  const dueSoonBills = billsWithStatus.filter(bill => bill.status === 'due-soon').length;
  const totalBillsAmount = bills.filter(bill => !bill.isPaid).reduce((sum, bill) => sum + bill.amount, 0);

  const getStatusBadge = (status: string, daysUntilDue: number) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive">Overdue ({Math.abs(daysUntilDue)} days)</Badge>;
      case 'due-soon':
        return <Badge variant="default">Due in {daysUntilDue} days</Badge>;
      case 'upcoming':
        return <Badge variant="outline">Due in {daysUntilDue} days</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Paid</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Cards */}
      {(overdueBills > 0 || dueSoonBills > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueBills > 0 && (
            <Card className="border-destructive/50 bg-destructive/10 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-destructive">
                    {overdueBills} overdue bill{overdueBills > 1 ? 's' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {dueSoonBills > 0 && (
            <Card className="border-warning/50 bg-warning/10 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-warning" />
                  <span className="font-medium text-warning">
                    {dueSoonBills} bill{dueSoonBills > 1 ? 's' : ''} due soon
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bills</p>
                <p className="text-2xl font-bold">{bills.length}</p>
              </div>
              <Bell className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold text-warning">{toCurrency(totalBillsAmount)}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid This Month</p>
                <p className="text-2xl font-bold text-success">{bills.filter(bill => bill.isPaid).length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Bill Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bill Reminders</h2>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-primary hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Bill
        </Button>
      </div>

      {/* Bill Form */}
      {showForm && (
        <Card className="shadow-card border-primary/20">
          <CardHeader>
            <CardTitle>{editingBill ? 'Edit Bill' : 'Add New Bill'}</CardTitle>
            <CardDescription>Set up a reminder for your recurring or one-time bills</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Bill title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {BILL_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map(freq => (
                    <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="number"
                placeholder="Reminder days before"
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Select due date"}
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
            
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="bg-gradient-primary hover:opacity-90">
                {editingBill ? 'Update Bill' : 'Add Bill'}
              </Button>
              <Button onClick={resetForm} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bills List */}
      <div className="grid gap-4">
        {billsWithStatus.map(bill => (
          <Card key={bill.id} className={`shadow-card ${
            bill.status === 'overdue' ? 'border-destructive/50 bg-destructive/5' :
            bill.status === 'due-soon' ? 'border-warning/50 bg-warning/5' :
            bill.status === 'paid' ? 'border-success/50 bg-success/5' : ''
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {bill.title}
                    {getStatusBadge(bill.status, bill.daysUntilDue)}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{bill.category}</Badge>
                    <span>•</span>
                    <span>{bill.frequency}</span>
                    <span>•</span>
                    <span>Due: {format(bill.dueDate, "MMM dd, yyyy")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{toCurrency(bill.amount)}</span>
                  <Button variant="ghost" size="sm" onClick={() => editBill(bill)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteBill(bill.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {!bill.isPaid && (
                <Button 
                  onClick={() => markAsPaid(bill.id)}
                  variant="outline"
                  size="sm"
                  className="border-success text-success hover:bg-success hover:text-success-foreground"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {bills.length === 0 && !showForm && (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Bill Reminders</h3>
            <p className="text-muted-foreground mb-4">Set up reminders to never miss a payment</p>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Bill
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}