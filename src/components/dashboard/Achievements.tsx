import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, TrendingUp, Award, Shield, Zap, Crown } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  badgeIcon: string;
  badgeColor: string;
  points: number;
  category: string;
  isEarned: boolean;
  progress?: number;
  maxProgress?: number;
}

interface UserStats {
  totalPoints: number;
  savingsStreak: number;
  budgetStreak: number;
  goalsCompleted: number;
  totalSaved: number;
  expensesTracked: number;
  billsPaid: number;
}

const ACHIEVEMENT_TEMPLATES: Omit<Achievement, 'id' | 'isEarned' | 'progress'>[] = [
  {
    title: "First Steps",
    description: "Add your first expense to start tracking",
    badgeIcon: "Star",
    badgeColor: "#3B82F6",
    points: 10,
    category: "Getting Started",
    maxProgress: 1
  },
  {
    title: "Goal Setter",
    description: "Create your first financial goal",
    badgeIcon: "Target",
    badgeColor: "#10B981",
    points: 25,
    category: "Goals",
    maxProgress: 1
  },
  {
    title: "Budget Master",
    description: "Stay within budget for 7 consecutive days",
    badgeIcon: "Shield",
    badgeColor: "#8B5CF6",
    points: 50,
    category: "Budgeting",
    maxProgress: 7
  },
  {
    title: "Savings Champion",
    description: "Save 20% of your income for a month",
    badgeIcon: "Trophy",
    badgeColor: "#FFD700",
    points: 100,
    category: "Savings",
    maxProgress: 20
  },
  {
    title: "Bill Tracker",
    description: "Pay 5 bills on time",
    badgeIcon: "Zap",
    badgeColor: "#F59E0B",
    points: 75,
    category: "Bills",
    maxProgress: 5
  },
  {
    title: "Goal Achiever",
    description: "Complete your first financial goal",
    badgeIcon: "Award",
    badgeColor: "#EF4444",
    points: 150,
    category: "Goals",
    maxProgress: 1
  },
  {
    title: "Expense Expert",
    description: "Track 50+ expenses",
    badgeIcon: "TrendingUp",
    badgeColor: "#06B6D4",
    points: 100,
    category: "Tracking",
    maxProgress: 50
  },
  {
    title: "Financial Guru",
    description: "Maintain 30% savings rate for 3 months",
    badgeIcon: "Crown",
    badgeColor: "#7C3AED",
    points: 250,
    category: "Mastery",
    maxProgress: 90
  }
];

const getIconComponent = (iconName: string) => {
  const icons = {
    Star, Target, Trophy, TrendingUp, Award, Shield, Zap, Crown
  };
  return icons[iconName as keyof typeof icons] || Star;
};

export function Achievements() {
  // Mock user stats - in real app, this would come from database/context
  const [userStats] = useState<UserStats>({
    totalPoints: 185,
    savingsStreak: 5,
    budgetStreak: 12,
    goalsCompleted: 1,
    totalSaved: 25000,
    expensesTracked: 23,
    billsPaid: 3
  });

  const achievements = useMemo(() => {
    return ACHIEVEMENT_TEMPLATES.map(template => {
      let progress = 0;
      let isEarned = false;

      // Calculate progress based on user stats and achievement type
      switch (template.title) {
        case "First Steps":
          progress = Math.min(userStats.expensesTracked, 1);
          isEarned = userStats.expensesTracked >= 1;
          break;
        case "Goal Setter":
          progress = Math.min(userStats.goalsCompleted > 0 ? 1 : 0, 1);
          isEarned = userStats.goalsCompleted > 0;
          break;
        case "Budget Master":
          progress = Math.min(userStats.budgetStreak, 7);
          isEarned = userStats.budgetStreak >= 7;
          break;
        case "Savings Champion":
          // Assuming 20% savings rate calculation
          progress = Math.min(userStats.savingsStreak * 3, 20);
          isEarned = userStats.savingsStreak >= 7;
          break;
        case "Bill Tracker":
          progress = Math.min(userStats.billsPaid, 5);
          isEarned = userStats.billsPaid >= 5;
          break;
        case "Goal Achiever":
          progress = Math.min(userStats.goalsCompleted, 1);
          isEarned = userStats.goalsCompleted >= 1;
          break;
        case "Expense Expert":
          progress = Math.min(userStats.expensesTracked, 50);
          isEarned = userStats.expensesTracked >= 50;
          break;
        case "Financial Guru":
          progress = Math.min(userStats.savingsStreak * 10, 90);
          isEarned = userStats.savingsStreak >= 9;
          break;
      }

      return {
        ...template,
        id: crypto.randomUUID(),
        isEarned,
        progress
      };
    });
  }, [userStats]);

  const earnedAchievements = achievements.filter(a => a.isEarned);
  const nextAchievements = achievements.filter(a => !a.isEarned && (a.progress || 0) > 0);
  const categories = [...new Set(achievements.map(a => a.category))];

  const getUserLevel = (points: number) => {
    if (points < 50) return { level: 1, title: "Beginner", color: "#6B7280" };
    if (points < 150) return { level: 2, title: "Apprentice", color: "#3B82F6" };
    if (points < 300) return { level: 3, title: "Expert", color: "#10B981" };
    if (points < 500) return { level: 4, title: "Master", color: "#8B5CF6" };
    return { level: 5, title: "Guru", color: "#FFD700" };
  };

  const userLevel = getUserLevel(userStats.totalPoints);
  const nextLevelPoints = [50, 150, 300, 500, 1000][userLevel.level - 1] || 1000;
  const levelProgress = ((userStats.totalPoints % nextLevelPoints) / nextLevelPoints) * 100;

  return (
    <div className="space-y-6">
      {/* User Level Card */}
      <Card className="shadow-card bg-gradient-card">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Level {userLevel.level} - {userLevel.title}</CardTitle>
          <CardDescription>{userStats.totalPoints} Points Earned</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Progress to Level {userLevel.level + 1}
            </p>
            <Progress value={levelProgress} className="h-3" />
            <p className="text-xs text-muted-foreground mt-1">
              {userStats.totalPoints} / {nextLevelPoints} points
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{earnedAchievements.length}</p>
            <p className="text-sm text-muted-foreground">Achievements</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{userStats.goalsCompleted}</p>
            <p className="text-sm text-muted-foreground">Goals Completed</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{userStats.budgetStreak}</p>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold">{userStats.totalPoints}</p>
            <p className="text-sm text-muted-foreground">Total Points</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Achievements */}
      {nextAchievements.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Almost There!</h3>
          <div className="grid gap-4">
            {nextAchievements.slice(0, 3).map(achievement => {
              const IconComponent = getIconComponent(achievement.badgeIcon);
              const progressPercentage = achievement.maxProgress 
                ? ((achievement.progress || 0) / achievement.maxProgress) * 100 
                : 0;
              
              return (
                <Card key={achievement.id} className="shadow-card border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${achievement.badgeColor}20` }}
                      >
                        <IconComponent 
                          className="h-6 w-6" 
                          style={{ color: achievement.badgeColor }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <Badge variant="outline">{achievement.points} pts</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={progressPercentage} className="flex-1 h-2" />
                          <span className="text-xs text-muted-foreground">
                            {achievement.progress}/{achievement.maxProgress}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Earned Achievements */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Your Achievements</h3>
        
        {earnedAchievements.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">No Achievements Yet</h4>
              <p className="text-muted-foreground">
                Start tracking expenses and setting goals to earn your first achievement!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {categories.map(category => {
              const categoryAchievements = earnedAchievements.filter(a => a.category === category);
              if (categoryAchievements.length === 0) return null;
              
              return (
                <div key={category}>
                  <h4 className="text-lg font-medium mb-3 text-muted-foreground">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryAchievements.map(achievement => {
                      const IconComponent = getIconComponent(achievement.badgeIcon);
                      
                      return (
                        <Card key={achievement.id} className="shadow-card border-success/20 bg-success/5">
                          <CardContent className="p-4 text-center">
                            <div 
                              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                              style={{ backgroundColor: achievement.badgeColor }}
                            >
                              <IconComponent className="h-8 w-8 text-white" />
                            </div>
                            <h4 className="font-semibold mb-1">{achievement.title}</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              {achievement.description}
                            </p>
                            <Badge variant="secondary" className="bg-success/20 text-success">
                              +{achievement.points} points
                            </Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Achievements (Locked) */}
      <div>
        <h3 className="text-xl font-semibold mb-4">All Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.filter(a => !a.isEarned && (a.progress || 0) === 0).map(achievement => {
            const IconComponent = getIconComponent(achievement.badgeIcon);
            
            return (
              <Card key={achievement.id} className="shadow-card opacity-60">
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <IconComponent className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold mb-1 text-muted-foreground">{achievement.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {achievement.description}
                  </p>
                  <Badge variant="outline" className="opacity-60">
                    {achievement.points} points
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}