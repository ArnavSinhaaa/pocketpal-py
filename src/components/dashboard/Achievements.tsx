import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Zap, Target, TrendingUp, Award } from "lucide-react";
import { useUserStats } from "@/hooks/useUserStats";
import { useAchievements } from "@/hooks/useAchievements";

export function Achievements() {
  const { stats, loading: statsLoading } = useUserStats();
  const { achievements, loading: achievementsLoading, checkAndAwardAchievements } = useAchievements();

  // Check for new achievements when stats change
  useEffect(() => {
    if (stats && !statsLoading) {
      checkAndAwardAchievements(stats);
    }
  }, [stats, statsLoading, checkAndAwardAchievements]);

  const loading = statsLoading || achievementsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Define achievement criteria and progress
  const achievementCriteria = [
    {
      id: 'first_expense',
      title: 'First Step',
      description: 'Add your first expense',
      icon: <Zap className="h-6 w-6" />,
      target: 1,
      current: stats?.expenses_count || 0,
      points: 10,
      category: 'expense_tracking'
    },
    {
      id: 'expense_tracker',
      title: 'Expense Tracker',
      description: 'Track 10 expenses',
      icon: <TrendingUp className="h-6 w-6" />,
      target: 10,
      current: stats?.expenses_count || 0,
      points: 25,
      category: 'expense_tracking'
    },
    {
      id: 'expense_master',
      title: 'Expense Master',
      description: 'Track 50 expenses',
      icon: <Trophy className="h-6 w-6" />,
      target: 50,
      current: stats?.expenses_count || 0,
      points: 100,
      category: 'expense_tracking'
    },
    {
      id: 'goal_setter',
      title: 'Goal Setter',
      description: 'Complete your first financial goal',
      icon: <Target className="h-6 w-6" />,
      target: 1,
      current: stats?.goals_completed || 0,
      points: 50,
      category: 'goal_achievement'
    },
    {
      id: 'streak_beginner',
      title: 'Getting Started',
      description: 'Maintain a 3-day streak',
      icon: <Star className="h-6 w-6" />,
      target: 3,
      current: stats?.current_streak || 0,
      points: 15,
      category: 'consistency'
    },
    {
      id: 'streak_champion',
      title: 'Consistency Champion',
      description: 'Maintain a 7-day streak',
      icon: <Award className="h-6 w-6" />,
      target: 7,
      current: stats?.current_streak || 0,
      points: 75,
      category: 'consistency'
    }
  ];

  const earnedAchievements = achievements.filter(a => a.achievement_type !== 'placeholder');
  const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-primary">{totalPoints}</p>
              </div>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expenses Tracked</p>
                <p className="text-2xl font-bold">{stats?.expenses_count || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Goals Completed</p>
                <p className="text-2xl font-bold">{stats?.goals_completed || 0}</p>
              </div>
              <Target className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{stats?.current_streak || 0} days</p>
              </div>
              <Zap className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earned Achievements */}
      {earnedAchievements.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Your Achievements ({earnedAchievements.length})
            </CardTitle>
            <CardDescription>Congratulations on your financial milestones!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedAchievements.map(achievement => (
                <Card key={achievement.id} className="border-2 border-success bg-success/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-success/20">
                        <Trophy className="h-5 w-5 text-success" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                        <Badge className="bg-success">
                          +{achievement.points} points
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Achievements */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Available Achievements
          </CardTitle>
          <CardDescription>Keep tracking to unlock these rewards!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievementCriteria.map(achievement => {
              const progress = Math.min((achievement.current / achievement.target) * 100, 100);
              const isCompleted = achievement.current >= achievement.target;
              const isEarned = earnedAchievements.some(a => a.achievement_type === achievement.id);

              return (
                <Card key={achievement.id} className={`border-2 transition-all ${
                  isCompleted || isEarned 
                    ? 'border-success bg-success/5' 
                    : 'border-border hover:border-primary/50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        isCompleted || isEarned ? 'bg-success/20' : 'bg-muted'
                      }`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          {(isCompleted || isEarned) && (
                            <Badge className="bg-success">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{achievement.current}/{achievement.target}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className="text-xs">
                              +{achievement.points} points
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(progress)}% complete
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}