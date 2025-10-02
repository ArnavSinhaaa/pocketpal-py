import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Star, Crown, Zap, Trophy, Sparkles } from "lucide-react";

interface LevelProgressProps {
  totalPoints: number;
}

const LEVEL_TIERS = [
  { level: 1, name: "Beginner", minPoints: 0, maxPoints: 99, icon: Zap, color: "text-gray-500", bgColor: "bg-gray-500/10" },
  { level: 2, name: "Starter", minPoints: 100, maxPoints: 249, icon: Star, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { level: 3, name: "Explorer", minPoints: 250, maxPoints: 499, icon: Sparkles, color: "text-green-500", bgColor: "bg-green-500/10" },
  { level: 4, name: "Tracker", minPoints: 500, maxPoints: 999, icon: Trophy, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  { level: 5, name: "Pro", minPoints: 1000, maxPoints: 1999, icon: Trophy, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  { level: 6, name: "Expert", minPoints: 2000, maxPoints: 3999, icon: Crown, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { level: 7, name: "Master", minPoints: 4000, maxPoints: 6999, icon: Crown, color: "text-pink-500", bgColor: "bg-pink-500/10" },
  { level: 8, name: "Legend", minPoints: 7000, maxPoints: 9999, icon: Crown, color: "text-red-500", bgColor: "bg-red-500/10" },
  { level: 9, name: "Champion", minPoints: 10000, maxPoints: Infinity, icon: Crown, color: "text-gradient-primary", bgColor: "bg-gradient-primary/10" }
];

export function LevelProgress({ totalPoints }: LevelProgressProps) {
  const currentTier = LEVEL_TIERS.find(
    tier => totalPoints >= tier.minPoints && totalPoints <= tier.maxPoints
  ) || LEVEL_TIERS[0];

  const nextTier = LEVEL_TIERS.find(tier => tier.level === currentTier.level + 1);
  
  const progressToNextLevel = nextTier
    ? ((totalPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const pointsToNextLevel = nextTier ? nextTier.minPoints - totalPoints : 0;

  const Icon = currentTier.icon;

  return (
    <Card className="shadow-card border-0 bg-gradient-card">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <motion.div
            className={`p-4 rounded-full ${currentTier.bgColor}`}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Icon className={`h-8 w-8 ${currentTier.color}`} />
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  Level {currentTier.level}
                  <Badge className={currentTier.bgColor}>
                    <span className={currentTier.color}>{currentTier.name}</span>
                  </Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {totalPoints.toLocaleString()} total points
                </p>
              </div>
            </div>
            
            {nextTier && (
              <>
                <Progress value={progressToNextLevel} className="h-3 mb-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {pointsToNextLevel.toLocaleString()} points to <span className="font-semibold">{nextTier.name}</span>
                  </span>
                  <span className="font-semibold">{progressToNextLevel.toFixed(0)}%</span>
                </div>
              </>
            )}
            
            {!nextTier && (
              <div className="flex items-center gap-2 text-success">
                <Crown className="h-4 w-4" />
                <span className="font-semibold">Maximum Level Reached!</span>
              </div>
            )}
          </div>
        </div>

        {/* Level Benefits */}
        <div className="mt-4 p-4 rounded-lg bg-muted/50">
          <h4 className="font-semibold text-sm mb-2">Level Benefits</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {currentTier.level >= 3 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>Special Badges</span>
              </div>
            )}
            {currentTier.level >= 5 && (
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-orange-500" />
                <span>Pro Tracker</span>
              </div>
            )}
            {currentTier.level >= 7 && (
              <div className="flex items-center gap-1">
                <Crown className="h-3 w-3 text-purple-500" />
                <span>Master Status</span>
              </div>
            )}
            {currentTier.level >= 9 && (
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-pink-500" />
                <span>Champion Title</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
