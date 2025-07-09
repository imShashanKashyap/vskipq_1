import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MenuItem, OrderWithItems, Restaurant, Table } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PhoneVerification from "@/components/PhoneVerification";
import MenuItemCard from "@/components/MenuItemCard";
import TableSelectionWizard from "@/components/TableSelectionWizard";
import { Utensils, ShoppingBag, X, Plus, Minus, Table as TableIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

// Define User interface to match AuthContext
interface User {
  id: number;
  username: string;
  role: string;
  restaurantId: number | null;
}

type PageView = "restaurantSelect" | "menu" | "orderStatus"; // Removed chef view

// Order status steps
const ORDER_STEPS = [
  { status: "pending", icon: "✅", title: "Order Placed", description: "⏳ Waiting for Chef to Accept..." },
  { status: "preparing", icon: "🍳", title: "Order Accepted", description: "Your food is being prepared..." },
  { status: "ready", icon: "🥳", title: "Order Ready", description: "Please collect your order!" }
];

interface MenuPageProps {
  initialView?: PageView;
  restaurantId?: number;
}

export default function MenuPage({ initialView = "menu", restaurantId }: MenuPageProps) {
  const [location, navigate] = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [countryCode, setCountryCode] = useState("+1"); // Default to US country code
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [currentView, setCurrentView] = useState<PageView>(initialView);
  const [currentOrder, setCurrentOrder] = useState<OrderWithItems | null>(null);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isTableSelectionWizardOpen, setIsTableSelectionWizardOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { cartItems, addToCart: addItemToCart, updateQuantity, clearCart, updateCustomerInfo, customerInfo } = useCart();
  
  // Fetch restaurants
  const { data: restaurants = [], isLoading: isLoadingRestaurants } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });
  
  // Get the restaurant ID from localStorage or props on first render
  useEffect(() => {
    // Valid restaurant IDs in our system
    const validRestaurantIds = [2, 3, 5, 6];
    
    // First prioritize the props restaurantId (if valid)
    if (restaurantId && validRestaurantIds.includes(restaurantId)) {
      setSelectedRestaurant(restaurantId);
      // Save to both localStorage keys for compatibility
      localStorage.setItem("selectedRestaurant", restaurantId.toString());
      localStorage.setItem("currentRestaurantId", restaurantId.toString());
      setCurrentView("menu");
      return;
    }
    
    // Then check localStorage
    const storedRestaurant = localStorage.getItem("selectedRestaurant");
    if (storedRestaurant) {
      try {
        const id = parseInt(storedRestaurant, 10);
        // Verify the restaurant ID is valid
        if (validRestaurantIds.includes(id)) {
          setSelectedRestaurant(id);
          // Save to both localStorage keys for compatibility
          localStorage.setItem("selectedRestaurant", id.toString());
          localStorage.setItem("currentRestaurantId", id.toString());
          // Auto-set to menu view when restaurant is loaded
          setCurrentView("menu");
        } else {
          console.log("Invalid restaurant ID in localStorage:", id);
          toast({
            title: "Restaurant not found",
            description: "Please select a valid restaurant",
            variant: "destructive"
          });
          navigate('/'); // Redirect to home/restaurant list
        }
      } catch (error) {
        console.error("Failed to parse restaurant ID:", error);
        navigate('/'); // Redirect to home/restaurant list
      }
    } else {
      // If no restaurant ID provided, redirect to restaurant list
      navigate('/');
    }
  }, [restaurantId, navigate, toast]);

  // Fetch menu items for selected restaurant
  const { data: menuItems = [], isLoading: isLoadingMenu } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu", selectedRestaurant],
    enabled: !!selectedRestaurant,
    queryFn: async () => {
      // Ensure restaurantId is a number and convert it to a string for the query parameter
      const restaurantId = Number(selectedRestaurant);
      console.log("Fetching menu items for restaurant ID:", restaurantId);
      const response = await fetch(`/api/menu?restaurantId=${restaurantId}`);
      if (!response.ok) throw new Error('Failed to fetch menu items');
      const data = await response.json();
      console.log("Menu API response:", data);
      return data;
    }
  });
  
  // Fetch tables for selected restaurant
  const getTablesQuery = useQuery<Table[]>({
    queryKey: ["/api/tables", selectedRestaurant],
    enabled: !!selectedRestaurant,
    queryFn: async () => {
      const restaurantId = Number(selectedRestaurant);
      const response = await fetch(`/api/tables?restaurantId=${restaurantId}`);
      if (!response.ok) throw new Error('Failed to fetch tables');
      return response.json();
    }
  });
  
  // Removed chef view functionality - use ChefLogin and ChefDashboard instead
  
  // Show all menu items
  const displayedItems = menuItems;
  console.log("Current restaurant ID:", selectedRestaurant);
  console.log("Menu items:", menuItems);
  
  // Setup a websocket connection
  useEffect(() => {
    if (!tableNumber) {
      return; // Don't attempt connection if no table number is available
    }
    
    // Add a short delay to ensure the page is ready
    const connectionTimer = setTimeout(() => {
      try {
        // Connect to WebSocket for real-time updates
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws?target=${tableNumber}`;
        
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          console.log("WebSocket connected for table", tableNumber);
        };
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("WebSocket message received:", data);
            
            if (data.type === 'ORDER_UPDATED' && currentOrder?.id === data.order.id) {
              // Update current order status
              setCurrentOrder(data.order);
              
              // Show notification based on status
              if (data.order.status === 'preparing') {
                toast({
                  title: "Order Update",
                  description: "Your order is now being prepared!",
                });
              } else if (data.order.status === 'ready') {
                toast({
                  title: "Order Ready!",
                  description: "Your order is ready! Please collect it at the counter.",
                  variant: "default",
                });
              }
            }
            
            // Invalidate orders query to refresh chef view
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };
        
        socket.onerror = (err) => {
          console.error("WebSocket error:", err);
        };
        
        socket.onclose = () => {
          console.log("WebSocket connection closed");
        };
      } catch (error) {
        console.error("Failed to establish WebSocket connection:", error);
      }
      
      // No direct cleanup function needed here - we'll handle it at the outer level
      // This catch block is for the try that surrounds socket creation
      return undefined;
    }, 500);
    
    // Cleanup the timer if the component unmounts before the timer fires
    return () => clearTimeout(connectionTimer);
  }, [tableNumber, currentOrder?.id, queryClient, toast]);
  
  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order placed successfully!",
        description: `Your order #${data.id} has been received.`,
      });
      // Clear cart after successful order
      clearCart();
      setIsCartOpen(false);
      // Set the current order and change view
      setCurrentOrder(data);
      
      // Navigate to the order confirmation page
      navigate(`/order/confirmation/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update order status mutation (for chef)
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Order updated",
        description: `Order #${data.id} status updated to ${data.status}`,
      });
      // Refresh orders
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update order",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await apiRequest("POST", "/api/verify-phone/send-otp", { phoneNumber });
      return response.json();
    },
    onSuccess: (data) => {
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your phone",
      });
      // In development mode, we might get the OTP in the response
      if (data.code) {
        setOtpCode(data.code);
        toast({
          title: "Development Mode",
          description: `Using test OTP: ${data.code}`,
          variant: "default"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async ({ phoneNumber, otpCode }: { phoneNumber: string, otpCode: string }) => {
      const response = await apiRequest("POST", "/api/verify-phone/verify-otp", { phoneNumber, otpCode });
      return response.json();
    },
    onSuccess: () => {
      setIsPhoneVerified(true);
      toast({
        title: "Phone Verified",
        description: "Your phone number has been verified successfully",
      });
      
      // Proceed with order placement
      handlePhoneVerified();
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Add item to cart
  const addToCart = (menuItem: MenuItem) => {
    // Use the CartContext function to add the item to cart
    addItemToCart(menuItem);
    
    // Show a smaller, more compact toast notification
    toast({
      title: `${menuItem.name} added`,
      variant: "default",
      duration: 1500, // Show for 1.5 seconds only
    });
  };
  
  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive"
      });
      return;
    }
    
    if (!customerName || !customerPhone) {
      toast({
        title: "Missing information",
        description: "Please provide your name and phone number.",
        variant: "destructive"
      });
      return;
    }
    
    // Save customer information
    updateCustomerInfo({
      name: customerName,
      phone: getFullPhoneNumber(), // Use full phone with country code
      notes: ""
    });
    
    // Close cart modal
    setIsCartOpen(false);
    
    // Redirect to payment page
    navigate('/payment');
  };
  
  // Get the full phone number with country code
  const getFullPhoneNumber = () => {
    return `${countryCode}${customerPhone.replace(/\D/g, '')}`;
  };

  // Handle sending OTP
  const handleSendOtp = () => {
    if (!customerPhone) {
      toast({
        title: "WhatsApp number required",
        description: "Please enter your WhatsApp number first.",
        variant: "destructive"
      });
      return;
    }
    
    sendOtpMutation.mutate(getFullPhoneNumber());
  };
  
  // Handle verifying OTP
  const handleVerifyOtp = () => {
    if (!otpCode) {
      toast({
        title: "OTP required",
        description: "Please enter the verification code.",
        variant: "destructive"
      });
      return;
    }
    
    verifyOtpMutation.mutate({
      phoneNumber: getFullPhoneNumber(),
      otpCode
    });
  };
  
  // Handle phone verification success
  const handlePhoneVerified = () => {
    setIsVerifyingPhone(false);
    setIsPhoneVerified(true);
    toast({
      title: "WhatsApp Number Verified",
      description: "Your WhatsApp number has been verified. Proceed to payment.",
    });
    
    // Update customer info in cart context
    updateCustomerInfo({
      name: customerName,
      phone: getFullPhoneNumber(), // Use full phone with country code
      notes: ""
    });
    
    // Redirect to payment page instead of directly placing the order
    navigate('/payment');
    
    // Close the verification modal
    setIsCartOpen(false);
  };
  
  // Handle chef authentication
  // Chef-related login functions have been moved to dedicated ChefLogin component
  
  // We're now using the CartContext for cart operations, so these functions are not needed anymore
  // and are replaced by functions from useCart() hook
  
  // Get cart items count
  const getItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };
  
  // Get total price
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  // Use updateQuantity from the CartContext
  
  // Get table number from localStorage and set initial view
  useEffect(() => {
    // Set initial view if provided
    setCurrentView(initialView);
    
    const storedTableNumber = localStorage.getItem("tableNumber");
    
    if (storedTableNumber) {
      const parsedTableNumber = parseInt(storedTableNumber, 10);
      if (!isNaN(parsedTableNumber)) {
        setTableNumber(parsedTableNumber);
      }
    } else {
      // Ask the user for their table number
      const urlParams = new URLSearchParams(window.location.search);
      const tableParam = urlParams.get('table');
      
      if (tableParam && !isNaN(parseInt(tableParam, 10))) {
        // If table number is in URL params, use that
        const parsedTableNumber = parseInt(tableParam, 10);
        setTableNumber(parsedTableNumber);
        localStorage.setItem("tableNumber", parsedTableNumber.toString());
      } else {
        // Show animated table selection wizard
        setIsTableSelectionWizardOpen(true);
      }
    }
  }, [initialView]);
  
  if (isLoadingMenu && currentView === "menu") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Render Menu View
  const renderMenuView = () => (
    <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-20">
      {/* Mobile-friendly restaurant name heading - shown only on small screens */}
      <div className="sm:hidden mb-4">
        <h2 className="text-xl font-bold text-center">
          {restaurants.find(r => r.id === selectedRestaurant)?.name || "Our Menu"}
        </h2>
      </div>
      
      {/* Action buttons row - reorganized for mobile */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div className="grid grid-cols-2 xs:flex gap-2 xs:space-x-2 mb-4 sm:mb-0">
          <button 
            onClick={() => navigate('/restaurants')}
            className="flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-200 rounded-full hover:bg-gray-300 transition"
          >
            <i className="ri-restaurant-line mr-1"></i>
            <span className="hidden xs:inline">Change</span> Restaurant
          </button>
          
          <button 
            onClick={() => setIsTableSelectionWizardOpen(true)}
            className="flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-200 rounded-full hover:bg-gray-300 transition"
          >
            <TableIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden xs:inline">Change</span> Table
          </button>
          
          <button 
            onClick={() => navigate('/tracking-order')}
            className="flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-200 rounded-full hover:bg-gray-300 transition"
          >
            <i className="ri-history-line mr-1"></i>
            Track <span className="hidden xs:inline">Orders</span>
          </button>
          
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-200 rounded-full hover:bg-gray-300 transition"
          >
            <i className="ri-arrow-left-line mr-1"></i>
            Back
          </button>
        </div>
        
        {/* Desktop restaurant name - hidden on mobile */}
        <h2 className="hidden sm:block text-2xl font-bold">
          {restaurants.find(r => r.id === selectedRestaurant)?.name || "Our Menu"}
        </h2>
        <div className="hidden sm:block w-20"></div>
      </div>
      
      {/* Loading state */}
      {isLoadingMenu && (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF5722]"></div>
        </div>
      )}
      
      {/* Empty menu state */}
      {displayedItems.length === 0 && !isLoadingMenu ? (
        <div className="text-center py-8 px-4">
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
            <p className="text-lg text-gray-500 mb-4">No menu items found for this restaurant.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-[#FF5722] text-white px-5 py-2 rounded-full text-sm font-medium"
            >
              Select Another Restaurant
            </button>
          </div>
        </div>
      ) : (
        <div id="menu-section" className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {!isLoadingMenu && displayedItems.map(item => (
            <MenuItemCard 
              key={item.id} 
              item={item} 
              onAddToCart={addToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
  
  // Render Order Status View
  const renderOrderStatusView = () => {
    if (!currentOrder) {
      return (
        <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-20 text-center">
          <div className="bg-white rounded-lg shadow p-6 sm:p-8 max-w-md mx-auto">
            <div className="text-4xl text-[#FF5722] mb-4">
              <i className="ri-error-warning-line"></i>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4">No Active Order</h2>
            <p className="text-neutral-600 mb-6">You don't have any active orders at the moment.</p>
            <button
              onClick={() => setCurrentView("menu")}
              className="bg-[#FF5722] text-white py-2 px-6 rounded-full text-sm font-medium"
            >
              Return to Menu
            </button>
          </div>
        </div>
      );
    }
    
    // Find current step index
    const currentStepIndex = ORDER_STEPS.findIndex(step => step.status === currentOrder.status);
    
    return (
      <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-20">
        {/* Mobile-friendly action buttons */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div className="flex gap-2 sm:space-x-3">
            <button 
              onClick={() => setCurrentView("menu")}
              className="flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-200 rounded-full hover:bg-gray-300 transition"
            >
              <i className="ri-menu-line mr-1"></i>
              Menu
            </button>
            <button 
              onClick={() => navigate('/tracking-order')}
              className="flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-200 rounded-full hover:bg-gray-300 transition"
            >
              <i className="ri-history-line mr-1"></i>
              Track <span className="hidden xs:inline">Orders</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 max-w-lg mx-auto">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Order #{currentOrder.id}</h2>
            <p className="text-neutral-500 mt-1">Table #{tableNumber}</p>
          </div>
          
          {/* Order progress steps - mobile-optimized */}
          <div className="mb-6 sm:mb-8">
            <div className="relative">
              {/* Progress line */}
              <div className="absolute left-0 top-8 sm:top-10 w-full h-1 bg-gray-200"></div>
              <div 
                className="absolute left-0 top-8 sm:top-10 h-1 bg-[#FF5722] transition-all duration-500" 
                style={{ width: `${(currentStepIndex / (ORDER_STEPS.length - 1)) * 100}%` }}
              ></div>
              
              {/* Steps */}
              <div className="flex justify-between relative">
                {ORDER_STEPS.map((step, index) => {
                  const isActive = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <div key={step.status} className="flex flex-col items-center relative">
                      <div 
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold z-10 border-2 ${
                          isActive 
                            ? 'bg-[#FF5722] text-white border-[#FF5722]' 
                            : 'bg-white text-gray-400 border-gray-200'
                        } ${isCurrent ? 'ring-2 sm:ring-4 ring-orange-100' : ''}`}
                      >
                        {step.icon}
                      </div>
                      <div className="mt-2 text-center">
                        <p className={`text-xs sm:text-sm font-medium ${isActive ? 'text-[#FF5722]' : 'text-gray-400'}`}>
                          {step.title}
                        </p>
                        {isCurrent && (
                          <p className="text-xs sm:text-sm text-gray-500 max-w-[80px] sm:max-w-[120px]">{step.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg text-center text-sm sm:text-base">
            {currentOrder.status === 'pending' && (
              <p>Your order has been received. Please wait for the chef to accept it.</p>
            )}
            {currentOrder.status === 'preparing' && (
              <p>Your order is now being prepared by our chef!</p>
            )}
            {currentOrder.status === 'ready' && (
              <p className="font-bold text-[#FF5722]">Your order is ready! Please collect it at the counter.</p>
            )}
          </div>
          
          <div className="divide-y mb-5 sm:mb-6 text-sm sm:text-base">
            <div className="py-2 font-semibold text-neutral-600">Order Details</div>
            {currentOrder.items.map((item) => (
              <div key={item.id} className="py-2 flex justify-between">
                <span className="pr-2">{item.quantity}x {item.menuItem.name}</span>
                <span className="text-right">${((item.price * item.quantity) / 100).toFixed(2)}</span>
              </div>
            ))}
            <div className="py-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>${(currentOrder.items.reduce((total, item) => total + (item.price * item.quantity), 0) / 100).toFixed(2)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => setCurrentView("menu")}
              className="bg-[#FF5722] text-white py-2.5 sm:py-3 rounded-lg text-sm font-medium"
            >
              Back to Menu
            </button>
            
            <button
              onClick={() => navigate('/tracking-order')}
              className="bg-gray-100 text-gray-800 py-2.5 sm:py-3 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Track Order
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render Restaurant Selection View
  const renderRestaurantSelectView = () => {
    return (
      <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-20">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Select a Restaurant</h2>
        
        {isLoadingRestaurants ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF5722]"></div>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="bg-white rounded-lg p-5 sm:p-8 text-center shadow-md max-w-md mx-auto">
            <div className="text-3xl sm:text-4xl text-[#FF5722] mb-4">
              <i className="ri-restaurant-line"></i>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No Restaurants Available</h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Please contact support to add restaurants to the system.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {restaurants.map(restaurant => (
              <div 
                key={restaurant.id} 
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer"
                onClick={() => {
                  setSelectedRestaurant(restaurant.id);
                  setCurrentView("menu");
                  toast({
                    title: "Selected Restaurant",
                    description: `You're now viewing ${restaurant.name}`,
                    duration: 2000
                  });
                }}
              >
                <div className="h-28 sm:h-40 bg-gradient-to-r from-[#FF5722] to-[#FF9800] flex items-center justify-center">
                  <Utensils size={40} className="sm:hidden text-white" />
                  <Utensils size={64} className="hidden sm:block text-white" />
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-bold text-base sm:text-lg">{restaurant.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">{restaurant.address}</p>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1">{restaurant.phone}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Chef-related functionality has been completely moved to dedicated Chef components
  
  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Table Selection Wizard */}
      {isTableSelectionWizardOpen && (
        <TableSelectionWizard 
          isOpen={isTableSelectionWizardOpen}
          onClose={(tableId) => {
            setIsTableSelectionWizardOpen(false);
            if (tableId) {
              // Get the table number from the tables
              const selectedTable = getTablesQuery.data?.find(table => table.id === tableId);
              if (selectedTable) {
                setTableNumber(selectedTable.tableNumber);
                toast({
                  title: "Table Selected",
                  description: `You've selected table #${selectedTable.tableNumber}`,
                });
              }
            }
          }}
          restaurantId={selectedRestaurant || 0}
          defaultTableNumber={tableNumber}
        />
      )}
      
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Restaurant logo/name */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-[#FF5722] rounded-full flex items-center justify-center">
              <i className="ri-restaurant-2-fill text-white text-xl"></i>
            </div>
            <div className="ml-2">
              <h1 className="font-['Poppins'] font-semibold text-lg">Scan2Order</h1>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {currentView === "menu" && (
              <button 
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="bg-[#FF5722] text-white py-2 px-4 rounded-full flex items-center font-medium text-sm"
              >
                <i className="ri-shopping-cart-2-line mr-1"></i>
                {getItemsCount()} items
              </button>
            )}
            
            {currentView === "orderStatus" && (
              <button 
                onClick={() => setCurrentView("menu")}
                className="bg-[#FF5722] text-white py-2 px-4 rounded-full flex items-center font-medium text-sm"
              >
                <i className="ri-arrow-left-line mr-1"></i>
                Menu
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content based on current view */}
      {currentView === "restaurantSelect" && renderRestaurantSelectView()}
      {currentView === "menu" && renderMenuView()}
      {currentView === "orderStatus" && renderOrderStatusView()}

      {/* Sticky cart indicator - positioned on the right side */}
      {currentView === "menu" && cartItems.length > 0 && !isCartOpen && (
        <div 
          onClick={() => setIsCartOpen(true)}
          className="fixed right-4 bottom-16 bg-[#FF5722] text-white 
                    rounded-full py-2 px-3 shadow-lg cursor-pointer flex items-center 
                    transition hover:scale-105 active:scale-95 z-10"
        >
          <div className="relative mr-1">
            <i className="ri-shopping-cart-2-fill text-lg"></i>
            <span className="absolute -top-1 -right-1 bg-white text-[#FF5722] rounded-full text-xs font-bold w-4 h-4 flex items-center justify-center">
              {getItemsCount()}
            </span>
          </div>
          <span className="font-medium text-sm">${(getTotalPrice() / 100).toFixed(2)}</span>
        </div>
      )}
      
      {/* Phone verification modal */}
      {isVerifyingPhone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg">
            <PhoneVerification 
              phoneNumber={customerPhone}
              onVerified={handlePhoneVerified}
              onCancel={() => setIsVerifyingPhone(false)}
            />
          </div>
        </div>
      )}
      
      {/* Removed customer/chef selector button as it's unnecessary */}
      
      {/* Cart / Checkout panel */}
      {isCartOpen && currentView === "menu" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-full sm:max-w-md h-full overflow-auto">
            <div className="border-b sticky top-0 bg-white z-10">
              <div className="p-3 sm:p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-base sm:text-lg">Your Order</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Table #{tableNumber}</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-neutral-500 hover:bg-gray-100 p-2 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {cartItems.length > 0 && (
                <div className="bg-[#FFF3E0] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm flex items-center justify-between">
                  <div className="flex items-center text-[#FF5722]">
                    <i className="ri-information-line mr-1"></i>
                    <span>{getItemsCount()} items in cart</span>
                  </div>
                  <span className="font-medium">${(getTotalPrice() / 100).toFixed(2)}</span>
                </div>
              )}
            </div>
            
            {cartItems.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200 mb-4">
                  <i className="ri-shopping-cart-line text-3xl sm:text-4xl text-amber-500 mb-2"></i>
                  <p className="text-amber-700 font-medium text-sm sm:text-base">Your cart is empty</p>
                  <p className="text-xs sm:text-sm text-amber-600 mt-1">Please add items to your cart to place an order.</p>
                </div>
                <div className="flex justify-center">
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      setTimeout(() => {
                        document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 300);
                    }}
                    className="bg-[#FF5722] text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium flex items-center"
                  >
                    <i className="ri-arrow-left-line mr-1"></i>
                    Browse Menu
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {cartItems.map(item => {
                  // Calculate item total
                  const itemTotal = item.price * item.quantity;
                  
                  return (
                    <div key={item.menuItemId} className="p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center max-w-[75%]">
                          <div className="bg-gray-50 text-[#FF5722] font-semibold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center mr-2 flex-shrink-0 text-xs sm:text-sm">
                            {item.quantity}
                          </div>
                          <h4 className="font-medium text-sm sm:text-base truncate">{item.name}</h4>
                        </div>
                        <div>
                          <button 
                            onClick={() => updateQuantity(item.menuItemId, 0)}
                            className="text-red-500 p-1 hover:bg-red-50 rounded"
                          >
                            <i className="ri-delete-bin-line text-sm sm:text-base"></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded">
                          <button 
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-white border flex items-center justify-center text-gray-600"
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <span className="w-5 sm:w-6 text-center font-medium text-xs sm:text-sm">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-white border flex items-center justify-center text-gray-600"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-xs sm:text-sm text-gray-500">${(item.price / 100).toFixed(2)} each</p>
                          <p className="font-semibold text-sm sm:text-base">${(itemTotal / 100).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="p-3 sm:p-4 mt-auto border-t sticky bottom-0 bg-white">
              <div className="flex justify-between mb-3">
                <span className="font-semibold text-sm sm:text-base">Total Amount:</span>
                <span className="font-bold text-base sm:text-lg text-[#FF5722]">${(getTotalPrice() / 100).toFixed(2)}</span>
              </div>
              
              {cartItems.length === 0 ? (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-4 text-center">
                  <div className="flex items-center justify-center text-amber-700 font-medium mb-2">
                    <i className="ri-shopping-cart-line text-2xl mr-2"></i>
                    <span>Your Cart is Empty</span>
                  </div>
                  <p className="text-amber-700 mb-4">Please add items to your cart to place an order.</p>
                  
                  <button 
                    onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-[#FF5722] text-white px-6 py-3 rounded-full text-sm font-medium flex items-center mx-auto"
                  >
                    <i className="ri-restaurant-line mr-2"></i>
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4 text-sm text-gray-700">
                    <div className="flex items-center text-green-700 font-medium mb-1">
                      <i className="ri-information-line mr-1"></i>
                      Complete the form below to place your order
                    </div>
                    <p>Your order will be prepared once you provide your details and verify your WhatsApp number.</p>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <div className="flex space-x-2 mb-2">
                      <select 
                        value={countryCode} 
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="px-2 py-2 border rounded-lg w-24"
                      >
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+91">+91 (IN)</option>
                        <option value="+86">+86 (CN)</option>
                        <option value="+61">+61 (AU)</option>
                        <option value="+33">+33 (FR)</option>
                        <option value="+81">+81 (JP)</option>
                        <option value="+49">+49 (DE)</option>
                        <option value="+55">+55 (BR)</option>
                        <option value="+52">+52 (MX)</option>
                      </select>
                      
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          placeholder="WhatsApp Number (without country code)"
                          value={customerPhone}
                          onChange={(e) => {
                            setCustomerPhone(e.target.value);
                            // Reset verification status when phone changes
                            if (isPhoneVerified) {
                              setIsPhoneVerified(false);
                            }
                            setOtpSent(false);
                          }}
                          className={`w-full px-4 py-2 border rounded-lg ${isPhoneVerified ? 'border-green-500 pr-10' : ''}`}
                        />
                        {isPhoneVerified && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                            <i className="ri-check-line"></i>
                          </div>
                        )}
                        {!isPhoneVerified && !otpSent && customerPhone.length >= 10 && (
                          <button 
                            onClick={handleSendOtp} 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-blue-500 text-white px-2 py-1 rounded"
                            disabled={sendOtpMutation.isPending}
                          >
                            {sendOtpMutation.isPending ? 'Sending...' : 'Send OTP'}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {otpSent && !isPhoneVerified && (
                      <div className="mt-2">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Enter OTP"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className="flex-1 px-4 py-2 border rounded-lg"
                            maxLength={6}
                          />
                          <button
                            onClick={handleVerifyOtp}
                            disabled={verifyOtpMutation.isPending}
                            className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm"
                          >
                            {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {isPhoneVerified && (
                      <div className="text-sm text-green-600 flex items-center">
                        <i className="ri-checkbox-circle-line mr-1"></i>
                        WhatsApp number verified
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    disabled={!customerName || !customerPhone || !isPhoneVerified || placeOrderMutation.isPending}
                    className={`w-full py-3 rounded-lg font-medium relative ${
                      customerName && customerPhone && isPhoneVerified && !placeOrderMutation.isPending
                        ? 'bg-[#FF5722] text-white hover:bg-[#E64A19] transition-colors'
                        : 'bg-neutral-300 text-neutral-500'
                    }`}
                  >
                    {placeOrderMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Placing Order...
                      </span>
                    ) : !isPhoneVerified && customerPhone ? (
                      <span className="flex items-center justify-center">
                        <i className="ri-shield-check-line mr-2"></i>
                        Verify WhatsApp Number to Continue
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <i className="ri-send-plane-fill mr-2"></i>
                        Place Order
                      </span>
                    )}
                  </button>
                  
                  {!customerName && (
                    <p className="mt-2 text-xs text-center text-amber-600">
                      <i className="ri-error-warning-line mr-1"></i>
                      Please enter your name to continue
                    </p>
                  )}
                  {customerName && !customerPhone && (
                    <p className="mt-2 text-xs text-center text-amber-600">
                      <i className="ri-error-warning-line mr-1"></i>
                      Please enter your WhatsApp number to continue
                    </p>
                  )}
                  {customerName && customerPhone && !isPhoneVerified && (
                    <p className="mt-2 text-xs text-center text-amber-600">
                      <i className="ri-error-warning-line mr-1"></i>
                      WhatsApp number verification required. Click "Send OTP" to verify.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Animated Table Selection Wizard */}
      <TableSelectionWizard 
        isOpen={isTableSelectionWizardOpen}
        onClose={(selectedTableId) => {
          setIsTableSelectionWizardOpen(false);
    
          if (selectedTableId) {
            // User selected a table - look up the table to get its number
            apiRequest("GET", `/api/tables/${selectedTableId}`)
              .then(res => res.json())
              .then(table => {
                // Set both table ID and table number
                setTableNumber(table.tableNumber);
                localStorage.setItem("tableId", selectedTableId.toString());
                localStorage.setItem("tableNumber", table.tableNumber.toString());
                
                toast({
                  title: "Table Selected",
                  description: `You're at table #${table.tableNumber}`,
                  duration: 3000
                });
              })
              .catch(err => {
                console.error("Error fetching table details:", err);
                // Fallback to default table number
                localStorage.setItem("tableNumber", "1");
                setTableNumber(1);
                
                toast({
                  title: "Default Table Set",
                  description: "Using table #1. You can update this in your cart.",
                  duration: 3000
                });
              });
          } else {
            // User canceled, set default table number
            localStorage.setItem("tableNumber", "1");
            setTableNumber(1);
            
            toast({
              title: "Default Table Set",
              description: "Using table #1. You can update this in your cart.",
              duration: 3000
            });
          }
        }}
        restaurantId={selectedRestaurant || 0}
        defaultTableNumber={tableNumber}
      />
    </div>
  );
}
