import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ExpenseTracker } from "@/components/dashboard/ExpenseTracker";
import { GoalsTracker } from "@/components/dashboard/GoalsTracker";
import { BillReminders } from "@/components/dashboard/BillReminders";
import { Achievements } from "@/components/dashboard/Achievements";
import { Wallet, Target, Bell, Trophy, TrendingUp } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Personal Finance Manager</h1>
                <p className="text-muted-foreground">Track expenses, manage budgets, and achieve your financial goals</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Bills</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Rewards</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Expense Tracking</h2>
                <p className="text-muted-foreground">Monitor your spending and manage your budget</p>
              </div>
            </div>
            <ExpenseTracker />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Financial Goals</h2>
                <p className="text-muted-foreground">Set targets and track your progress toward financial milestones</p>
              </div>
            </div>
            <GoalsTracker />
          </TabsContent>

          <TabsContent value="bills" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Bill Management</h2>
                <p className="text-muted-foreground">Never miss a payment with smart reminders and tracking</p>
              </div>
            </div>
            <BillReminders />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Achievements & Rewards</h2>
                <p className="text-muted-foreground">Earn points and unlock badges for reaching financial milestones</p>
              </div>
            </div>
            <Achievements />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;