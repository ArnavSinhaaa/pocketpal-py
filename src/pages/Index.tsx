import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ExpenseTracker } from "@/components/dashboard/ExpenseTracker";
import { GoalsTracker } from "@/components/dashboard/GoalsTracker";
import { BillReminders } from "@/components/dashboard/BillReminders";
import { Achievements } from "@/components/dashboard/Achievements";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, Target, Bell, Trophy, TrendingUp, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FinBuddy } from "@/components/FinBuddy";

const Index = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <FinBuddy />
      {/* Header */}
      <div className="border-b bg-gradient-card shadow-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Personal Finance Manager</h1>
                <p className="text-muted-foreground">Track expenses, manage budgets, and achieve your financial goals</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger 
              value="expenses" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Expenses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="goals" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bills" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Bills</span>
            </TabsTrigger>
            <TabsTrigger 
              value="achievements" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Rewards</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Expense Tracking</h2>
                <p className="text-muted-foreground">Monitor your spending and manage your budget</p>
              </div>
            </div>
            <ExpenseTracker />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Financial Goals</h2>
                <p className="text-muted-foreground">Set targets and track your progress toward financial milestones</p>
              </div>
            </div>
            <GoalsTracker />
          </TabsContent>

          <TabsContent value="bills" className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Bill Management</h2>
                <p className="text-muted-foreground">Never miss a payment with smart reminders and tracking</p>
              </div>
            </div>
            <BillReminders />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6 animate-fade-in">
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