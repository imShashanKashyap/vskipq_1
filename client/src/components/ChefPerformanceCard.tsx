import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Clock, Flame, Star, Trophy, Calendar } from "lucide-react";

// Define achievement details for display
const achievementDetails: Record<string, { title: string, description: string, icon: React.ReactNode }> = {
  first_order: {
    title: "First Order",
    description: "Completed your first order",
    icon: <Star className="h-4 w-4 text-yellow-400" />
  },
  ten_orders: {
    title: "Experienced Chef",
    description: "Completed 10 orders",
    icon: <Star className="h-4 w-4 text-yellow-400" />
  },
  fifty_orders: {
    title: "Master Chef",
    description: "Completed 50 orders",
    icon: <Trophy className="h-4 w-4 text-yellow-400" />
  },
  three_day_streak: {
    title: "Consistent Cook",
    description: "Worked 3 days in a row",
    icon: <Flame className="h-4 w-4 text-orange-500" />
  },
  seven_day_streak: {
    title: "Dedicated Chef",
    description: "Worked 7 days in a row",
    icon: <Flame className="h-4 w-4 text-red-500" />
  },
  speed_demon: {
    title: "Speed Demon",
    description: "Completed an order in under 2 minutes",
    icon: <Clock className="h-4 w-4 text-blue-500" />
  }
};

interface ChefPerformanceProps {
  performance: {
    id: number;
    userId: number;
    username?: string;
    restaurantId: number;
    ordersCompleted: number;
    averageOrderTime: number;
    fastestOrderTime?: number;
    dailyStreak: number;
    points: number;
    level: number;
    rank?: number;
    achievements: string[];
    lastSessionDate?: Date | string | null;
    newAchievements?: string[];
  };
  showNewAchievementToast?: (achievement: string) => void;
}

const ChefPerformanceCard: React.FC<ChefPerformanceProps> = ({ 
  performance, 
  showNewAchievementToast 
}) => {
  // Format time from seconds to minutes:seconds
  const formatTime = (seconds: number): string => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Calculate progress to next level (100 points per level)
  const progressToNextLevel = (performance.points % 100);
  
  // Show notifications for new achievements
  React.useEffect(() => {
    if (performance.newAchievements && showNewAchievementToast) {
      performance.newAchievements.forEach(achievement => {
        if (achievement in achievementDetails) {
          showNewAchievementToast(achievement);
        }
      });
    }
  }, [performance.newAchievements, showNewAchievementToast]);

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{performance.username || `Chef #${performance.userId}`}</CardTitle>
            <CardDescription className="text-white/80">
              Level {performance.level} Chef
            </CardDescription>
          </div>
          {performance.rank && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              <Trophy className="h-4 w-4 mr-1" />
              Rank #{performance.rank}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-2 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-500">Orders Completed</p>
            <p className="text-2xl font-bold">{performance.ordersCompleted}</p>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-500">Points</p>
            <p className="text-2xl font-bold">{performance.points}</p>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-500">Avg. Time</p>
            <p className="text-2xl font-bold">{formatTime(performance.averageOrderTime)}</p>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-500">Fastest</p>
            <p className="text-2xl font-bold">{formatTime(performance.fastestOrderTime || 0)}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Progress to Level {performance.level + 1}</span>
            <span className="text-sm font-medium">{progressToNextLevel}%</span>
          </div>
          <Progress value={progressToNextLevel} className="h-2" />
        </div>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Calendar className="h-4 w-4 mr-2 text-orange-500" />
            <span className="font-semibold">Daily Streak: {performance.dailyStreak} days</span>
          </div>
        </div>
        
        {performance.achievements && performance.achievements.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <Award className="h-4 w-4 mr-2 text-yellow-500" />
              Achievements
            </h4>
            <div className="flex flex-wrap gap-2">
              {performance.achievements.map((achievement) => (
                <Badge 
                  key={achievement} 
                  variant="outline" 
                  className={`flex items-center ${
                    performance.newAchievements?.includes(achievement) 
                      ? 'animate-pulse border-yellow-500' 
                      : ''
                  }`}
                >
                  {achievementDetails[achievement]?.icon}
                  <span className="ml-1">{achievementDetails[achievement]?.title}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChefPerformanceCard;