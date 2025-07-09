import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { apiRequest } from '@/lib/queryClient';
import { Order } from '@shared/schema';

const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#0088FE'];

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  restaurants: {
    id: number;
    name: string;
    orderCount: number;
    revenue: number;
  }[];
  dailyOrders: {
    date: string;
    orders: number;
    revenue: number;
  }[];
  topSellingItems: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

const emptyAnalyticsData: AnalyticsData = {
  totalOrders: 0,
  totalRevenue: 0,
  averageOrderValue: 0,
  restaurants: [],
  dailyOrders: [],
  topSellingItems: []
};

export default function AnalyticsDashboard() {
  const [isMatch, params] = useRoute('/admin/dashboard');
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(emptyAnalyticsData);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, authLoading, navigate]);
  
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        // In a real app, we would fetch real analytics data from the server
        // For now, we'll use a mock response with realistic data
        // const response = await apiRequest('GET', `/api/analytics?timeRange=${timeRange}`);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Sample data for demonstration
        const data: AnalyticsData = {
          totalOrders: 156,
          totalRevenue: 2845.75,
          averageOrderValue: 18.24,
          restaurants: [
            { id: 2, name: "Spice Garden", orderCount: 45, revenue: 812.50 },
            { id: 3, name: "Italian Delight", orderCount: 38, revenue: 722.80 },
            { id: 5, name: "Taco Fiesta", orderCount: 42, revenue: 653.25 },
            { id: 6, name: "Sushi Master", orderCount: 31, revenue: 657.20 }
          ],
          dailyOrders: [
            { date: "Mon", orders: 18, revenue: 324.50 },
            { date: "Tue", orders: 22, revenue: 415.75 },
            { date: "Wed", orders: 28, revenue: 512.20 },
            { date: "Thu", orders: 26, revenue: 478.80 },
            { date: "Fri", orders: 32, revenue: 589.25 },
            { date: "Sat", orders: 18, revenue: 322.60 },
            { date: "Sun", orders: 12, revenue: 202.65 }
          ],
          topSellingItems: [
            { name: "Chicken Tikka Masala", quantity: 48, revenue: 479.52 },
            { name: "Margherita Pizza", quantity: 42, revenue: 462.00 },
            { name: "Beef Tacos", quantity: 38, revenue: 323.00 },
            { name: "California Roll", quantity: 35, revenue: 315.00 },
            { name: "Paneer Butter Masala", quantity: 28, revenue: 279.72 }
          ]
        };
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.role === 'admin') {
      fetchAnalyticsData();
    }
  }, [timeRange, user]);
  
  // If loading or no user, show loading state
  if (authLoading || loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-orange-600">Analytics Dashboard</h1>
        <Button onClick={() => navigate('/admin')} variant="outline" className="border-orange-200 text-orange-600">
          Back to Admin Home
        </Button>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-8 bg-orange-50 p-1 border border-orange-100">
          <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Restaurants
          </TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Menu Items
          </TabsTrigger>
        </TabsList>
        
        <div className="mb-6 flex space-x-4">
          <Button 
            onClick={() => setTimeRange('day')} 
            variant={timeRange === 'day' ? 'default' : 'outline'}
            className={timeRange === 'day' ? 'bg-orange-500 hover:bg-orange-600' : 'border-orange-200 text-orange-600'}
          >
            Today
          </Button>
          <Button 
            onClick={() => setTimeRange('week')} 
            variant={timeRange === 'week' ? 'default' : 'outline'}
            className={timeRange === 'week' ? 'bg-orange-500 hover:bg-orange-600' : 'border-orange-200 text-orange-600'}
          >
            This Week
          </Button>
          <Button 
            onClick={() => setTimeRange('month')} 
            variant={timeRange === 'month' ? 'default' : 'outline'}
            className={timeRange === 'month' ? 'bg-orange-500 hover:bg-orange-600' : 'border-orange-200 text-orange-600'}
          >
            This Month
          </Button>
        </div>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border border-orange-100 shadow-sm">
              <h3 className="text-lg font-medium text-gray-500 mb-2">Total Orders</h3>
              <p className="text-3xl font-bold text-orange-600">{analyticsData.totalOrders}</p>
            </Card>
            <Card className="p-6 border border-orange-100 shadow-sm">
              <h3 className="text-lg font-medium text-gray-500 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-orange-600">${analyticsData.totalRevenue.toFixed(2)}</p>
            </Card>
            <Card className="p-6 border border-orange-100 shadow-sm">
              <h3 className="text-lg font-medium text-gray-500 mb-2">Avg. Order Value</h3>
              <p className="text-3xl font-bold text-orange-600">
                ${analyticsData.totalOrders > 0 
                  ? (analyticsData.totalRevenue / analyticsData.totalOrders).toFixed(2) 
                  : '0.00'}
              </p>
            </Card>
          </div>
          
          <Card className="p-6 border border-orange-100 shadow-sm">
            <h3 className="text-xl font-medium text-gray-700 mb-4">Orders & Revenue Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.dailyOrders}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" stroke="#FF8042" />
                  <YAxis yAxisId="right" orientation="right" stroke="#0088FE" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" name="Orders" fill="#FF8042" />
                  <Bar yAxisId="right" dataKey="revenue" name="Revenue ($)" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="restaurants" className="space-y-6">
          <Card className="p-6 border border-orange-100 shadow-sm">
            <h3 className="text-xl font-medium text-gray-700 mb-4">Restaurant Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.restaurants}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="orderCount"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {analyticsData.restaurants.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-600 mb-4">Restaurant Orders</h4>
                <div className="space-y-4">
                  {analyticsData.restaurants.map((restaurant) => (
                    <div key={restaurant.id} className="flex justify-between items-center">
                      <span className="font-medium">{restaurant.name}</span>
                      <div className="flex space-x-4">
                        <span className="text-orange-600 font-medium">{restaurant.orderCount} orders</span>
                        <span className="text-blue-600 font-medium">${restaurant.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="items" className="space-y-6">
          <Card className="p-6 border border-orange-100 shadow-sm">
            <h3 className="text-xl font-medium text-gray-700 mb-4">Top Selling Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-orange-100">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Item Name</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Quantity Sold</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.topSellingItems.map((item, index) => (
                    <tr key={index} className="border-b border-orange-50">
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="py-3 px-4 text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">${item.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}