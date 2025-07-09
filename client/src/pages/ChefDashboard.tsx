import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrderWithItems, Restaurant } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import ChefOrderCard from "@/components/ChefOrderCard";
import { useWebSocket } from "@/context/WebSocketContext";
import { useOrder } from "@/context/OrderContext";
import { Button } from "@/components/ui/button";
import { 
  ChefHat, 
  LogOut, 
  RefreshCcw, 
  Clock, 
  Coffee, 
  ShoppingBag,
  Search,
  ClipboardList,
  Trophy,
  BarChart2,
} from "lucide-react";

export default function ChefDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { connectWebSocket } = useWebSocket();
  const { orders: contextOrders, updateOrderStatus } = useOrder();
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  console.log("ChefDashboard rendering - Auth user:", user);
  console.log("ChefDashboard rendering - Selected restaurant:", selectedRestaurantId);
  
  // Optimized WebSocket connection with retry mechanism
  useEffect(() => {
    // Only connect when we have a valid restaurant ID
    if (!selectedRestaurantId) return;
    
    let connected = false;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 1000;
    
    const connectWithRetry = () => {
      if (connected || retryCount >= maxRetries) return;
      
      try {
        console.log(`ChefDashboard: Connecting to WebSocket for restaurant ${selectedRestaurantId} (attempt ${retryCount + 1})`);
        connectWebSocket(`restaurant-${selectedRestaurantId}`, selectedRestaurantId);
        connected = true;
      } catch (err) {
        retryCount++;
        console.warn(`WebSocket connection failed, retrying (${retryCount}/${maxRetries})...`);
        setTimeout(connectWithRetry, retryDelay); 
      }
    };
    
    // Start connection attempt
    connectWithRetry();
    
    // No need for manual cleanup as WebSocketContext handles this automatically
  }, [connectWebSocket, selectedRestaurantId]);
  
  // Get stored restaurant ID from localStorage on component mount
  useEffect(() => {
    // Priority 1: Use the chef's assigned restaurant from their account if available
    if (user?.restaurantId) {
      console.log("Setting selected restaurant from user profile:", user.restaurantId);
      setSelectedRestaurantId(user.restaurantId);
      localStorage.setItem('selectedRestaurant', user.restaurantId.toString());
    } 
    // Priority 2: Use the stored restaurant ID from localStorage
    else {
      const storedRestaurantId = localStorage.getItem('selectedRestaurant');
      console.log("Setting selected restaurant from localStorage:", storedRestaurantId);
      if (storedRestaurantId) {
        setSelectedRestaurantId(parseInt(storedRestaurantId));
      }
    }
  }, [user?.restaurantId]);
  
  // Get restaurant name if chef has restaurantId
  useEffect(() => {
    if (selectedRestaurantId) {
      console.log("ChefDashboard - Fetching restaurant details for:", selectedRestaurantId);
      fetch(`/api/restaurants/${selectedRestaurantId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch restaurant: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log("ChefDashboard - Restaurant details received:", data);
          setRestaurantName(data.name);
          // Store the selected restaurant in localStorage
          localStorage.setItem('selectedRestaurant', selectedRestaurantId.toString());
        })
        .catch(err => {
          console.error("Failed to fetch restaurant info:", err);
          toast({
            title: "Error",
            description: "Could not load restaurant details. Please try again.",
            variant: "destructive"
          });
        });
    }
  }, [selectedRestaurantId, toast]);
  
  // Check if user is authenticated
  useEffect(() => {
    console.log("ChefDashboard - Current user:", user);
    
    // Try to load chef user from localStorage if AuthContext user is not available
    if (!user) {
      const storedChefUser = localStorage.getItem("chefUser");
      
      if (storedChefUser) {
        try {
          const chefUser = JSON.parse(storedChefUser);
          console.log("ChefDashboard - Found stored chef user:", chefUser);
          // We'll continue with the dashboard using the stored user data
          
          // If we have a restaurantId, make sure it's used for the dashboard
          if (chefUser.restaurantId) {
            console.log("ChefDashboard - Setting restaurant ID from stored chef user:", chefUser.restaurantId);
            setSelectedRestaurantId(chefUser.restaurantId);
            localStorage.setItem('selectedRestaurant', chefUser.restaurantId.toString());
          } else if (!selectedRestaurantId) {
            // If no restaurant ID in user object, try from standalone localStorage item
            const storedRestaurantId = localStorage.getItem('selectedRestaurant');
            if (storedRestaurantId) {
              console.log("ChefDashboard - Setting restaurant ID from localStorage:", storedRestaurantId);
              setSelectedRestaurantId(parseInt(storedRestaurantId));
            }
          }
        } catch (err) {
          console.error("ChefDashboard - Failed to parse stored chef user:", err);
          // Don't navigate away immediately - we'll show the restaurant selection screen
          // Let user choose a restaurant instead
        }
      } else {
        // Get restaurant ID from localStorage even if no user is found
        const storedRestaurantId = localStorage.getItem('selectedRestaurant');
        if (storedRestaurantId) {
          console.log("ChefDashboard - Setting restaurant ID from localStorage:", storedRestaurantId);
          setSelectedRestaurantId(parseInt(storedRestaurantId));
        } else {
          console.log("ChefDashboard - No user or restaurant found, showing restaurant selector");
          // We'll show the restaurant selection screen
        }
      }
    } else {
      console.log("ChefDashboard - User authenticated:", user.username);
      // If auth context user has restaurantId, use it
      if (user.restaurantId) {
        console.log("ChefDashboard - Setting restaurant ID from authenticated user:", user.restaurantId);
        setSelectedRestaurantId(user.restaurantId);
        localStorage.setItem('selectedRestaurant', user.restaurantId.toString());
      }
    }
  }, [user]);
  
  // Track manual refresh state
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  
  // Handle manual refresh with debounce
  const handleManualRefresh = async () => {
    if (isManualRefreshing || isRefetching) return;
    
    setIsManualRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Dashboard refreshed",
        description: "Latest orders have been loaded",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Could not refresh orders, please try again",
        variant: "destructive",
      });
    } finally {
      // Add a slight delay to prevent rapid clicking
      setTimeout(() => {
        setIsManualRefreshing(false);
      }, 1000);
    }
  };
  
  // Fetch orders for the chef's restaurant
  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", selectedRestaurantId],
    queryFn: async () => {
      const endpoint = selectedRestaurantId 
        ? `/api/orders?restaurantId=${selectedRestaurantId}` 
        : "/api/orders";
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }
      return res.json();
    },
    enabled: !!selectedRestaurantId, // Only run query when restaurant is selected (don't require user as we can work with localStorage)
    refetchInterval: 8000, // Refresh every 8 seconds
    staleTime: 2000 // Consider data stale after 2 seconds
  });
  
  // Fetch restaurants for restaurant selector
  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants'],
    enabled: true, // Always fetch restaurants
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Use orders from context for real-time updates, filtered by restaurant
  const allOrders = contextOrders.length > 0 
    ? contextOrders.filter(order => {
        // Return true only if the order's restaurant ID matches selectedRestaurantId
        // Check both direct restaurant ID and via table's restaurant ID since different endpoints structure data differently
        return selectedRestaurantId && (
          (order.restaurant && order.restaurant.id === selectedRestaurantId) || 
          (order.table && order.table.restaurantId === selectedRestaurantId) ||
          (order.restaurantId === selectedRestaurantId)
        );
      })
    : orders;
  
  // Filter orders by search term
  const filteredOrders = allOrders.filter(order => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toString().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.table?.tableNumber.toString().includes(searchLower) ||
      order.items.some(item => item.menuItem?.name.toLowerCase().includes(searchLower))
    );
  });
  
  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      const response = await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: (data) => {
      // Update the order in the context
      updateOrderStatus(data);
      
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedRestaurantId] });
      
      toast({
        title: "Order updated",
        description: `Order #${data.id} status updated to ${data.status}`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update order",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleStatusUpdate = (orderId: number, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };
  
  const handleLogout = async () => {
    // Clear local storage
    localStorage.removeItem('chefUser');
    localStorage.removeItem('selectedRestaurant');
    
    // Call the logout function from auth context
    await logout();
    
    // Navigate back to login
    navigate("/chef/login");
  };
  
  // Remove this as we now use handleManualRefresh
  
  const handleRestaurantChange = (id: number) => {
    console.log("ChefDashboard - Setting restaurant:", id);
    setSelectedRestaurantId(id);
    localStorage.setItem('selectedRestaurant', id.toString());
  };
  
  // Filter orders by status for better organization
  const pendingOrders = filteredOrders.filter(order => order.status === "pending");
  const preparingOrders = filteredOrders.filter(order => order.status === "preparing");
  const readyOrders = filteredOrders.filter(order => order.status === "ready");
  
  console.log("ChefDashboard - Rendering component with:", {
    user,
    selectedRestaurantId,
    restaurantName,
    restaurantsList: restaurants,
    ordersCount: filteredOrders.length,
    pendingCount: pendingOrders.length,
    preparingCount: preparingOrders.length,
    readyCount: readyOrders.length
  });

  // Only show restaurant selection for users without a selected restaurant
  if (!selectedRestaurantId) {
    return (
      <section className="min-h-screen bg-neutral-100">
        <div className="bg-white shadow-sm">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#FF5722] rounded-full flex items-center justify-center">
                <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="ml-2">
                <h1 className="font-semibold text-base sm:text-lg">Scan2Order</h1>
                <p className="text-[11px] sm:text-xs text-neutral-600">Chef Dashboard</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="outline"
              size="sm"
              className="text-[#FF5722] text-xs h-8 sm:h-9 py-0"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Logout</span>
              <span className="inline xs:hidden">Exit</span>
            </Button>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-6 sm:py-12">
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm p-5 sm:p-8">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FFF3E0] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF5722]" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Select a Restaurant</h2>
              <p className="text-sm text-gray-600 mb-4 sm:mb-6">Please select a restaurant to view and manage its orders.</p>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Restaurant
              </label>
              <select
                value={selectedRestaurantId || ''}
                onChange={(e) => handleRestaurantChange(Number(e.target.value))}
                className="w-full p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              >
                <option value="" disabled>Select a restaurant</option>
                {restaurants.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
              
              <div className="pt-4 sm:pt-6">
                <Button 
                  disabled={!selectedRestaurantId}
                  onClick={() => {}} // Already handled by onChange
                  className="w-full bg-[#FF5722] hover:bg-[#E64A19] transition py-2 h-auto text-sm sm:text-base"
                >
                  Continue to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="min-h-screen bg-neutral-100">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#FF5722] rounded-full flex items-center justify-center">
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="ml-2">
              <h1 className="font-semibold text-base sm:text-lg">Scan2Order</h1>
              <p className="text-[11px] sm:text-xs text-neutral-600 truncate max-w-[160px] sm:max-w-none">
                {restaurantName ? `${restaurantName} - Chef Dashboard` : "Chef Dashboard"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3 w-full xs:w-auto justify-end">
            {/* Restaurant Selector - Only show for admin users without a specific restaurant */}
            {!user?.restaurantId && (
              <div className="relative flex-1 xs:flex-auto max-w-[180px] xs:max-w-none">
                <select
                  value={selectedRestaurantId || ''}
                  onChange={(e) => handleRestaurantChange(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 text-xs sm:text-sm rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 appearance-none pr-6 sm:pr-8"
                >
                  {restaurants.map(restaurant => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-1 sm:pr-2 pointer-events-none">
                  <i className="ri-arrow-down-s-line text-xs sm:text-sm text-gray-400"></i>
                </div>
              </div>
            )}
            
            <Button
              onClick={() => navigate("/chef/menu-management")}
              variant="outline"
              size="sm"
              className="text-[#4CAF50] text-xs sm:text-sm py-1 h-8 sm:h-9"
            >
              <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Manage Menu</span>
              <span className="inline sm:hidden">Menu</span>
            </Button>
            
            <Button 
              onClick={handleLogout} 
              variant="outline"
              size="sm"
              className="text-[#FF5722] text-xs sm:text-sm py-1 h-8 sm:h-9"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
              <span className="inline sm:hidden">Exit</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <h2 className="font-semibold text-lg sm:text-xl">Active Orders</h2>
          
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-auto">
              <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 sm:pl-9 pr-8 py-1 sm:py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm sm:w-48 md:w-64 focus:outline-none focus:ring-1 focus:ring-[#FF5722] focus:border-[#FF5722]"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-sm sm:text-base"></i>
                </button>
              )}
            </div>
            
            <button
              onClick={handleManualRefresh}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full transition flex-shrink-0"
              disabled={isManualRefreshing || isRefetching}
            >
              <RefreshCcw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${(isManualRefreshing || isRefetching) ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Status count cards - mobile friendly */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg p-2 sm:p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Pending</h3>
              <p className="text-lg sm:text-2xl font-bold">{pendingOrders.length}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#FFF3E0] rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF9800]" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-2 sm:p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Preparing</h3>
              <p className="text-lg sm:text-2xl font-bold">{preparingOrders.length}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center">
              <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-[#4CAF50]" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-2 sm:p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-500">Ready</h3>
              <p className="text-lg sm:text-2xl font-bold">{readyOrders.length}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#E3F2FD] rounded-full flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#2196F3]" />
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="bg-white rounded-lg p-6 sm:p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-t-[#FF5722] border-[#FF5722]/30 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center">
            <i className="ri-restaurant-2-line text-3xl sm:text-4xl text-neutral-300 mb-2 sm:mb-3"></i>
            <p className="text-neutral-600 text-sm sm:text-base">
              {searchTerm ? "No orders match your search." : "No active orders right now."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingOrders.length > 0 && (
              <div>
                <h3 className="font-medium text-base sm:text-lg mb-2 sm:mb-3 flex items-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF9800] mr-1.5 sm:mr-2" />
                  Pending Orders
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {pendingOrders.map(order => (
                    <ChefOrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={handleStatusUpdate}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {preparingOrders.length > 0 && (
              <div>
                <h3 className="font-medium text-base sm:text-lg mb-2 sm:mb-3 flex items-center">
                  <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-[#4CAF50] mr-1.5 sm:mr-2" /> 
                  Preparing
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {preparingOrders.map(order => (
                    <ChefOrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={handleStatusUpdate}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {readyOrders.length > 0 && (
              <div>
                <h3 className="font-medium text-base sm:text-lg mb-2 sm:mb-3 flex items-center">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#2196F3] mr-1.5 sm:mr-2" />
                  Ready for Pickup
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {readyOrders.map(order => (
                    <ChefOrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={handleStatusUpdate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
