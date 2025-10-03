import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Zap, Target, TrendingUp, Award, Sparkles, Flame, Gift, Crown } from "lucide-react";
import { useUserStats } from "@/hooks/useUserStats";
import { useAchievements } from "@/hooks/useAchievements";
import { LevelProgress } from "./LevelProgress";
import { motion, AnimatePresence } from "framer-motion";

export function Achievements() {
  const { stats, loading: statsLoading } = useUserStats();
  const { achievements, loading: achievementsLoading, checkAndAwardAchievements } = useAchievements();
  const [recentAchievement, setRecentAchievement] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Check for new achievements only once when stats are loaded
  useEffect(() => {
    if (stats && !statsLoading && !hasChecked) {
      checkAndAwardAchievements(stats);
      setHasChecked(true);
    }
  }, [stats, statsLoading, hasChecked]);

  // Show celebration animation for new achievements
  useEffect(() => {
    if (achievements.length > 0) {
      const latestAchievement = achievements[0];
      const isRecent = new Date(latestAchievement.earned_at).getTime() > Date.now() - 10000; // Within last 10 seconds
      
      if (isRecent && latestAchievement.id !== recentAchievement?.id) {
        setRecentAchievement(latestAchievement);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }
    }
  }, [achievements, recentAchievement]);

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

  // Enhanced achievement criteria with categories and better icons
  const achievementCategories = {
    expense_tracking: { name: 'Expense Tracking', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    goal_achievement: { name: 'Goal Achievement', color: 'text-green-500', bgColor: 'bg-green-500/10' },
    consistency: { name: 'Consistency', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    milestone: { name: 'Milestones', color: 'text-purple-500', bgColor: 'bg-purple-500/10' }
  };

  const achievementCriteria = [
    {
      id: 'first_expense',
      title: 'First Step',
      description: 'Add your first expense',
      icon: <Sparkles className="h-6 w-6" />,
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
      id: 'expense_legend',
      title: 'Expense Legend',
      description: 'Track 100 expenses',
      icon: <Crown className="h-6 w-6" />,
      target: 100,
      current: stats?.expenses_count || 0,
      points: 250,
      category: 'milestone'
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
      id: 'goal_achiever',
      title: 'Goal Achiever',
      description: 'Complete 5 financial goals',
      icon: <Award className="h-6 w-6" />,
      target: 5,
      current: stats?.goals_completed || 0,
      points: 150,
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
      icon: <Flame className="h-6 w-6" />,
      target: 7,
      current: stats?.current_streak || 0,
      points: 75,
      category: 'consistency'
    },
    {
      id: 'streak_legend',
      title: 'Streak Legend',
      description: 'Maintain a 30-day streak',
      icon: <Crown className="h-6 w-6" />,
      target: 30,
      current: stats?.current_streak || 0,
      points: 300,
      category: 'milestone'
    }
  ];

  // Deduplicate achievements by achievement_type (keep most recent), then sort
  const uniqueAchievements = achievements
    .filter(a => a.achievement_type !== 'placeholder')
    .reduce((acc, achievement) => {
      const existing = acc.find(a => a.achievement_type === achievement.achievement_type);
      if (!existing) {
        acc.push(achievement);
      } else {
        // Keep the most recent one
        const existingDate = new Date(existing.earned_at).getTime();
        const currentDate = new Date(achievement.earned_at).getTime();
        if (currentDate > existingDate) {
          const index = acc.indexOf(existing);
          acc[index] = achievement;
        }
      }
      return acc;
    }, [] as typeof achievements);

  const earnedAchievements = uniqueAchievements.sort((a, b) => {
    // Sort by date (most recent first)
    const dateA = new Date(a.earned_at).getTime();
    const dateB = new Date(b.earned_at).getTime();
    if (dateB !== dateA) return dateB - dateA;
    
    // Then by points (highest first)
    return b.points - a.points;
  });
  
  const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0);
  
  // Group earned achievements by category
  const groupedEarnedAchievements = earnedAchievements.reduce((acc, achievement) => {
    const matchingCriteria = achievementCriteria.find(c => c.id === achievement.achievement_type);
    const category = matchingCriteria?.category || 'milestone';
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, typeof earnedAchievements>);

  return (
    <div className="space-y-6 relative">
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && recentAchievement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-gradient-primary text-white p-4 rounded-lg shadow-elegant max-w-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/20">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold">🎉 Achievement Unlocked!</h4>
                <p className="text-sm">{recentAchievement.title}</p>
                <p className="text-xs opacity-90">+{recentAchievement.points} points!</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <LevelProgress totalPoints={totalPoints} />
      </motion.div>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-card border-0 bg-gradient-card hover:shadow-glow transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                  <motion.p
                    key={totalPoints}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-primary"
                  >
                    {totalPoints}
                  </motion.p>
                </div>
                <div className="relative">
                  <Trophy className="h-8 w-8 text-primary" />
                  {totalPoints > 0 && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-card border-0 bg-gradient-card hover:shadow-glow transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expenses Tracked</p>
                  <motion.p
                    key={stats?.expenses_count}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold"
                  >
                    {stats?.expenses_count || 0}
                  </motion.p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-card border-0 bg-gradient-card hover:shadow-glow transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Goals Completed</p>
                  <motion.p
                    key={stats?.goals_completed}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold"
                  >
                    {stats?.goals_completed || 0}
                  </motion.p>
                </div>
                <Target className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-card border-0 bg-gradient-card hover:shadow-glow transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                  <motion.p
                    key={stats?.current_streak}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold flex items-center gap-1"
                  >
                    {stats?.current_streak || 0}
                    <span className="text-sm">days</span>
                  </motion.p>
                </div>
                <div className="relative">
                  <Flame className="h-8 w-8 text-orange-500" />
                  {(stats?.current_streak || 0) > 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Earned Achievements - Grouped by Category */}
      {earnedAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-card border-0 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Your Achievements ({earnedAchievements.length})
              </CardTitle>
              <CardDescription>Congratulations on your financial milestones!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(achievementCategories).map(([categoryKey, category]) => {
                const categoryAchievements = groupedEarnedAchievements[categoryKey];
                if (!categoryAchievements || categoryAchievements.length === 0) return null;

                return (
                  <div key={categoryKey}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`p-2 rounded-full ${category.bgColor}`}>
                        <div className={`w-2 h-2 rounded-full ${category.color.replace('text-', 'bg-')}`} />
                      </div>
                      <h3 className={`font-semibold ${category.color}`}>
                        {category.name} ({categoryAchievements.length})
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryAchievements.map((achievement, index) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 * index }}
                          whileHover={{ scale: 1.05 }}
                          className="relative"
                        >
                          <Card className="border-2 border-success bg-gradient-to-br from-success/5 to-success/10 hover:shadow-glow transition-all duration-300">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <motion.div
                                  animate={{ rotate: [0, 10, -10, 0] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="p-2 rounded-full bg-success/20"
                                >
                                  <Trophy className="h-5 w-5 text-success" />
                                </motion.div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">{achievement.title}</h4>
                                  <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                                  <div className="flex items-center justify-between">
                                    <Badge className="bg-success hover:bg-success/90">
                                      <Gift className="h-3 w-3 mr-1" />
                                      +{achievement.points} points
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(achievement.earned_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <motion.div
                                className="absolute top-2 right-2"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <Sparkles className="h-4 w-4 text-yellow-500" />
                              </motion.div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Available Achievements by Category */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="shadow-card border-0 bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Available Achievements
            </CardTitle>
            <CardDescription>Keep tracking to unlock these rewards!</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.entries(achievementCategories).map(([categoryKey, category]) => {
              const categoryAchievements = achievementCriteria.filter(a => a.category === categoryKey);
              if (categoryAchievements.length === 0) return null;

              return (
                <div key={categoryKey} className="mb-8 last:mb-0">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`p-2 rounded-full ${category.bgColor}`}>
                      <div className={`w-2 h-2 rounded-full ${category.color.replace('text-', 'bg-')}`} />
                    </div>
                    <h3 className={`font-semibold ${category.color}`}>{category.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categoryAchievements.map((achievement, index) => {
                      const progress = Math.min((achievement.current / achievement.target) * 100, 100);
                      const isCompleted = achievement.current >= achievement.target;
                      const isEarned = earnedAchievements.some(a => a.achievement_type === achievement.id);

                      return (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <Card className={`border-2 transition-all duration-300 ${
                            isCompleted || isEarned 
                              ? 'border-success bg-gradient-to-br from-success/5 to-success/10 hover:shadow-glow' 
                              : 'border-border hover:border-primary/50 hover:shadow-card'
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <motion.div
                                  className={`p-2 rounded-full ${
                                    isCompleted || isEarned ? 'bg-success/20' : 'bg-muted'
                                  }`}
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.5 }}
                                >
                                  <div className={isCompleted || isEarned ? 'text-success' : 'text-muted-foreground'}>
                                    {achievement.icon}
                                  </div>
                                </motion.div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold">{achievement.title}</h4>
                                    {(isCompleted || isEarned) && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 500 }}
                                      >
                                        <Badge className="bg-success hover:bg-success/90">
                                          <Sparkles className="h-3 w-3 mr-1" />
                                          Completed
                                        </Badge>
                                      </motion.div>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                                  
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span>Progress</span>
                                      <span className="font-medium">{achievement.current}/{achievement.target}</span>
                                    </div>
                                    <div className="relative">
                                      <Progress value={progress} className="h-3" />
                                      {progress > 0 && (
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${progress}%` }}
                                          transition={{ duration: 1, ease: "easeOut" }}
                                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/20 to-primary/40 rounded-full"
                                        />
                                      )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <Badge variant="outline" className="text-xs">
                                        <Gift className="h-3 w-3 mr-1" />
                                        +{achievement.points} points
                                      </Badge>
                                      <span className="text-xs text-muted-foreground font-medium">
                                        {Math.round(progress)}% complete
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}