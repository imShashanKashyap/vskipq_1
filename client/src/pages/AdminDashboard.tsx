import { useState, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Restaurant } from "@shared/schema";

interface AnalyticsData {
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  orders: any[]; // Replace with proper order type
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | "all">("all");
  const [timePeriod, setTimePeriod] = useState("day");

  // Handle redirects in useEffect to avoid breaking hook rules
  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (!user) {
      navigate("/auth");
      return;
    }

    if (user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access the admin area.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  // Fetch restaurant data
  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants'],
  });

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/orders/analytics', selectedRestaurant, timePeriod],
    queryFn: async () => {
      let url = '/api/orders/analytics';
      const params = new URLSearchParams();
      
      if (selectedRestaurant !== "all") {
        params.append('restaurantId', selectedRestaurant.toString());
      }
      
      params.append('period', timePeriod);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Failed",
        description: "There was an issue logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 text-transparent bg-clip-text">
            Analytics Dashboard
          </h1>
          <p className="text-gray-500">View restaurant performance metrics</p>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant
            </label>
            <Select
              value={selectedRestaurant.toString()}
              onValueChange={(value) => setSelectedRestaurant(value === "all" ? "all" : parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a restaurant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Restaurants</SelectItem>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                    {restaurant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Period
            </label>
            <Select
              value={timePeriod}
              onValueChange={setTimePeriod}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "Loading..." : analyticsData?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {timePeriod === "day" ? "Today" : 
               timePeriod === "week" ? "This Week" : 
               timePeriod === "month" ? "This Month" : "This Year"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${isLoading ? "Loading..." : analyticsData?.totalSales?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {timePeriod === "day" ? "Today" : 
               timePeriod === "week" ? "This Week" : 
               timePeriod === "month" ? "This Month" : "This Year"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${isLoading ? "Loading..." : analyticsData?.averageOrderValue?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {timePeriod === "day" ? "Today" : 
               timePeriod === "week" ? "This Week" : 
               timePeriod === "month" ? "This Month" : "This Year"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        {isLoading ? (
          <div className="text-center py-8">Loading analytics data...</div>
        ) : analyticsData?.orders && analyticsData.orders.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.restaurantOrderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {restaurants.find(r => r.id === order.restaurantId)?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            No orders found for the selected criteria
          </div>
        )}
      </div>
    </div>
  );
}