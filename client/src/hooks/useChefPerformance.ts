import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, getQueryFn, apiRequest } from '@/lib/queryClient';

export interface ChefPerformance {
  id: number;
  userId: number;
  username?: string;
  restaurantId: number;
  ordersCompleted: number;
  averageOrderTime: number;
  fastestOrderTime?: number | null;
  dailyStreak: number;
  points: number;
  level: number;
  rank?: number;
  achievements: string[];
  lastSessionDate?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  newAchievements?: string[];
}

export interface LeaderboardEntry extends ChefPerformance {}

export function useChefPerformance(userId: number) {
  return useQuery<ChefPerformance>({
    queryKey: ['/api/chef/performance', userId],
    queryFn: getQueryFn({ 
      url: `/api/chef/performance/${userId}`,
      on401: "returnNull" 
    }),
    enabled: !!userId,
    // Don't refetch too frequently
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useRestaurantLeaderboard(restaurantId: number, limit: number = 10) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/restaurant/leaderboard', restaurantId, { limit }],
    queryFn: getQueryFn({ 
      url: `/api/restaurant/leaderboard/${restaurantId}?limit=${limit}`,
      on401: "returnNull"
    }),
    enabled: !!restaurantId,
    // Don't refetch too frequently
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCompleteOrder() {
  return useMutation({
    mutationFn: async ({ 
      userId, 
      orderId, 
      completionTime 
    }: { 
      userId: number;
      orderId: number;
      completionTime: number;
    }) => {
      const res = await apiRequest(
        'POST',
        `/api/chef/${userId}/complete-order`,
        { orderId, completionTime }
      );
      return await res.json();
    },
    onSuccess: (data: ChefPerformance) => {
      // Invalidate the chef performance query
      queryClient.invalidateQueries({ queryKey: ['/api/chef/performance', data.userId] });
      
      // Invalidate the restaurant leaderboard
      if (data.restaurantId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/restaurant/leaderboard', data.restaurantId] 
        });
      }
    },
  });
}