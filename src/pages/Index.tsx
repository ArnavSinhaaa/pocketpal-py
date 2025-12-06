import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ExpenseTracker } from "@/components/dashboard/ExpenseTracker";
import { GoalsTracker } from "@/components/dashboard/GoalsTracker";
import { BillReminders } from "@/components/dashboard/BillReminders";
import { Achievements } from "@/components/dashboard/Achievements";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, Target, Bell, Trophy, TrendingUp, LogOut, User, Lightbulb, Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FinBuddy } from "@/components/FinBuddy";
import { DonationSection } from "@/components/DonationSection";
import { Footer } from "@/components/Footer";
import { EnhancedIncomeForecast } from "@/components/insights/EnhancedIncomeForecast";
import { SpendingInsights } from "@/components/insights/SpendingInsights";
import { BudgetOptimizer } from "@/components/insights/BudgetOptimizer";
import { FinancialHealthScore } from "@/components/insights/FinancialHealthScore";
import { InvestmentPortfolio } from "@/components/ca-features/InvestmentPortfolio";
import { TaxOptimizer } from "@/components/ca-features/TaxOptimizer";
import { NetWorthDashboard } from "@/components/ca-features/NetWorthDashboard";
import { DebtManagement } from "@/components/ca-features/DebtManagement";
import { RetirementPlanner } from "@/components/ca-features/RetirementPlanner";
import { ParallaxSection, ScrollProgressBar } from "@/components/ParallaxSection";
import { FloatingParticles } from "@/components/FloatingParticles";
import { MobileNav } from "@/components/MobileNav";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

const Index = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("expenses");
  const [isMobile, setIsMobile] = useState(false);

  // Enable smooth scrolling on desktop
  useSmoothScroll({ smoothness: 0.08, mobileNative: true });

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Scroll to top on tab change for mobile
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative pb-20 md:pb-0">
      <FloatingParticles count={isMobile ? 15 : 30} />
      <ScrollProgressBar />
      <FinBuddy />
      
      {/* Header */}
      <div className="border-b bg-gradient-card shadow-card sticky top-0 z-40 backdrop-blur-sm bg-background/80">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold">FinMG</h1>
                <p className="text-muted-foreground">Your smart finance manager - Track, achieve, and level up! 🚀</p>
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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          {/* Desktop tab list - hidden on mobile */}
          <TabsList className="hidden md:grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger 
              value="expenses" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Expenses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Lightbulb className="h-4 w-4" />
              <span>AI Insights</span>
            </TabsTrigger>
            <TabsTrigger 
              value="goals" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Target className="h-4 w-4" />
              <span>Goals</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bills" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Bell className="h-4 w-4" />
              <span>Bills</span>
            </TabsTrigger>
            <TabsTrigger 
              value="achievements" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <Trophy className="h-4 w-4" />
              <span>Rewards</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            <ParallaxSection fadeIn speed={0.08}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Expense Tracking</h2>
                  <p className="text-muted-foreground">Monitor your spending and manage your budget</p>
                </div>
              </div>
            </ParallaxSection>
            <ParallaxSection fadeIn speed={0.12} delay={100}>
              <ExpenseTracker />
            </ParallaxSection>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <ParallaxSection fadeIn speed={0.08}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
                  <p className="text-muted-foreground">Get intelligent forecasts and personalized savings recommendations</p>
                </div>
              </div>
            </ParallaxSection>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ParallaxSection fadeIn speed={0.1} delay={0}>
                <FinancialHealthScore />
              </ParallaxSection>
              <ParallaxSection fadeIn speed={0.1} delay={100}>
                <BudgetOptimizer />
              </ParallaxSection>
              <ParallaxSection fadeIn speed={0.1} delay={200}>
                <EnhancedIncomeForecast />
              </ParallaxSection>
              <ParallaxSection fadeIn speed={0.1} delay={300}>
                <SpendingInsights />
              </ParallaxSection>
            </div>
            
            {/* CA-Level Features */}
            <ParallaxSection fadeIn speed={0.08} delay={400}>
              <div className="space-y-6">
                <div className="flex items-center gap-2 pt-6 border-t">
                  <h3 className="text-xl font-bold">Advanced CA Features</h3>
                  <Badge variant="secondary">Professional</Badge>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <ParallaxSection fadeIn speed={0.12} delay={0}>
                    <NetWorthDashboard />
                  </ParallaxSection>
                  <ParallaxSection fadeIn speed={0.12} delay={100}>
                    <DebtManagement />
                  </ParallaxSection>
                  <ParallaxSection fadeIn speed={0.12} delay={200}>
                    <RetirementPlanner />
                  </ParallaxSection>
                  <ParallaxSection fadeIn speed={0.12} delay={300}>
                    <InvestmentPortfolio />
                  </ParallaxSection>
                  <ParallaxSection fadeIn speed={0.12} delay={400}>
                    <TaxOptimizer />
                  </ParallaxSection>
                </div>
              </div>
            </ParallaxSection>
            
            <ParallaxSection fadeIn speed={0.1} delay={500} scaleOnScroll>
              <Card className="bg-gradient-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Tax Planner Assistant
                  </CardTitle>
                  <CardDescription>
                    Ask FinBuddy about tax slabs, deductions, and how they impact your income
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    FinBuddy can now explain your tax situation in plain language! Try asking:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>"Explain my tax slabs based on my income"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>"How much tax do I pay in each slab?"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>"What deductions can lower my tax?"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>"Should I choose old or new tax regime?"</span>
                    </li>
                  </ul>
                  <Button 
                    onClick={() => document.querySelector<HTMLElement>('[data-finbuddy-button]')?.click()}
                    className="mt-4 w-full"
                    variant="outline"
                  >
                    Open Tax Planner Chat
                  </Button>
                </CardContent>
              </Card>
            </ParallaxSection>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <ParallaxSection fadeIn speed={0.08}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Financial Goals</h2>
                  <p className="text-muted-foreground">Set targets and track your progress toward financial milestones</p>
                </div>
              </div>
            </ParallaxSection>
            <ParallaxSection fadeIn speed={0.12} delay={100}>
              <GoalsTracker />
            </ParallaxSection>
          </TabsContent>

          <TabsContent value="bills" className="space-y-6">
            <ParallaxSection fadeIn speed={0.08}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Bill Management</h2>
                  <p className="text-muted-foreground">Never miss a payment with smart reminders and tracking</p>
                </div>
              </div>
            </ParallaxSection>
            <ParallaxSection fadeIn speed={0.12} delay={100}>
              <BillReminders />
            </ParallaxSection>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <ParallaxSection fadeIn speed={0.08}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Achievements & Rewards</h2>
                  <p className="text-muted-foreground">Earn points and unlock badges for reaching financial milestones</p>
                </div>
              </div>
            </ParallaxSection>
            <ParallaxSection fadeIn speed={0.12} delay={100}>
              <Achievements />
            </ParallaxSection>
          </TabsContent>
        </Tabs>

        {/* Donation Section */}
        <ParallaxSection fadeIn speed={0.1} delay={200} className="mt-12">
          <DonationSection />
        </ParallaxSection>
      </div>

      {/* Footer */}
      <Footer />

      {/* Mobile bottom navigation */}
      <MobileNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
