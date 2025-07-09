import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  useChefPerformance,
  useRestaurantLeaderboard,
  type ChefPerformance,
  type LeaderboardEntry
} from '@/hooks/useChefPerformance';
import ChefPerformanceCard from '@/components/ChefPerformanceCard';
import LeaderboardTable from '@/components/LeaderboardTable';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trophy, BarChart2 } from 'lucide-react';

// Define achievement details for tooltips
const achievementDetails: Record<string, { title: string; description: string; }> = {
  first_order: {
    title: "First Order",
    description: "Completed your first order"
  },
  ten_orders: {
    title: "Experienced Chef",
    description: "Completed 10 orders"
  },
  fifty_orders: {
    title: "Master Chef",
    description: "Completed 50 orders"
  },
  three_day_streak: {
    title: "Consistent Cook",
    description: "Worked 3 days in a row"
  },
  seven_day_streak: {
    title: "Dedicated Chef",
    description: "Worked 7 days in a row"
  },
  speed_demon: {
    title: "Speed Demon",
    description: "Completed an order in under 2 minutes"
  }
};

const ChefPerformancePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get chef's performance data
  const { data: performanceData, isLoading: isLoadingPerformance } = 
    useChefPerformance(user?.id || 0);
  
  // Type-guard for performance data
  const performance = performanceData || {} as ChefPerformance;
  
  // Get restaurant leaderboard
  const { data: leaderboardData, isLoading: isLoadingLeaderboard } = 
    useRestaurantLeaderboard(user?.restaurantId || 0);
    
  // Type-guard for leaderboard data
  const leaderboard = leaderboardData || [] as LeaderboardEntry[];
  
  // Show toast for new achievements
  const showNewAchievementToast = React.useCallback((achievementId: string) => {
    const achievement = achievementDetails[achievementId];
    if (achievement) {
      toast({
        title: `🏆 New Achievement: ${achievement.title}`,
        description: achievement.description,
        duration: 5000,
      });
    }
  }, [toast]);

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to view your performance dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoadingPerformance || isLoadingLeaderboard) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Chef Performance Dashboard
      </h1>
      
      <Tabs defaultValue="performance" className="w-full mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="performance" className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" /> My Performance
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center">
            <Trophy className="h-4 w-4 mr-2" /> Leaderboard
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance">
          {Object.keys(performance).length > 0 ? (
            <div className="mx-auto max-w-md">
              <ChefPerformanceCard 
                performance={performance as ChefPerformance} 
                showNewAchievementToast={showNewAchievementToast} 
              />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Performance Data</CardTitle>
                <CardDescription>
                  Start completing orders to build your performance profile.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" /> Restaurant Leaderboard
              </CardTitle>
              <CardDescription>
                Top performing chefs ranked by points
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard && leaderboard.length > 0 ? (
                <LeaderboardTable 
                  entries={leaderboard} 
                  highlightUserId={user.id} 
                />
              ) : (
                <p className="text-center py-4 text-gray-500">
                  No leaderboard data available yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How Points Are Earned</CardTitle>
          <CardDescription>
            Learn how to climb the leaderboard and increase your chef level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-md p-4">
              <h3 className="font-semibold text-lg mb-2">Base Points</h3>
              <p className="text-gray-600">
                Each order completion earns 10 base points.
              </p>
            </div>
            <div className="border rounded-md p-4">
              <h3 className="font-semibold text-lg mb-2">Speed Bonus</h3>
              <p className="text-gray-600">
                Faster order completions earn up to 20 bonus points.
                The quicker you complete orders, the more points you earn!
              </p>
            </div>
            <div className="border rounded-md p-4">
              <h3 className="font-semibold text-lg mb-2">Streak Bonus</h3>
              <p className="text-gray-600">
                Work consecutive days to earn up to 25 streak bonus points.
                Each day adds 5 points to your streak bonus!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Available Achievements</CardTitle>
          <CardDescription>
            Special milestones to reach in your chef career
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(achievementDetails).map(([id, achievement]) => (
              <div 
                key={id} 
                className={`border rounded-md p-4 ${
                  (performance as ChefPerformance)?.achievements?.includes?.(id) 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50'
                }`}
              >
                <h3 className="font-semibold text-lg mb-1">{achievement.title}</h3>
                <p className="text-gray-600">{achievement.description}</p>
                {(performance as ChefPerformance)?.achievements?.includes?.(id) && (
                  <p className="text-green-600 text-sm mt-2">
                    ✓ Achieved
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChefPerformancePage;