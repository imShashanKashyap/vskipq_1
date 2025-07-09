import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { OrderWithItems } from "@shared/schema";
import OrderStatusCard from "@/components/OrderStatusCard";
import { useWebSocket } from "@/context/WebSocketContext";
import { useOrder } from "@/context/OrderContext";
import { CheckCircle, ChevronLeft, Phone, Home, ShoppingCart } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface OrderConfirmationParams {
  orderId?: string;
}

export default function OrderConfirmation() {
  const params = useParams<OrderConfirmationParams>();
  const orderId = params.orderId || '';
  const [, navigate] = useLocation();
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const { connectWebSocket } = useWebSocket();
  const { orders } = useOrder();
  
  // Fetch single order details directly - more reliable than fetching all orders
  const { data: singleOrder, isLoading: isLoadingOrder, refetch } = useQuery<OrderWithItems>({
    queryKey: [`/api/orders/${orderId}`],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        throw new Error('Order not found');
      }
      return res.json();
    },
    enabled: !!orderId,
    retry: 5, // Increase retry attempts
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 10000), // Exponential backoff with max 10s
    staleTime: 10000, // Consider data fresh for 10 seconds
    refetchInterval: 15000, // Auto-refresh every 15 seconds
  });
  
  // Get order from any available source: context, single order query, or all orders
  const order = orders.find(o => o.id === parseInt(orderId)) || 
    singleOrder;
  
  // Connect to WebSocket for this table
  useEffect(() => {
    const storedTableNumber = localStorage.getItem("tableNumber");
    
    if (storedTableNumber) {
      const parsedTableNumber = parseInt(storedTableNumber, 10);
      setTableNumber(parsedTableNumber);
      
      try {
        // Add a small delay to ensure the page is fully loaded
        const timer = setTimeout(() => {
          connectWebSocket(parsedTableNumber.toString());
          console.log("Connected to WebSocket for order tracking on table", parsedTableNumber);
        }, 500);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error("Error connecting to WebSocket:", error);
      }
    }
  }, [connectWebSocket]);
  
  // Store verified phone number in local storage if available
  useEffect(() => {
    if (order?.customerPhone) {
      localStorage.setItem("verifiedPhone", order.customerPhone);
      console.log("Stored verified phone number:", order.customerPhone);
    }
  }, [order]);
  
  // Reset cart and place another order
  const handlePlaceAnotherOrder = () => {
    navigate("/");
  };
  
  // Navigate back to home
  const handleBackToHome = () => {
    navigate("/");
  };
  
  // Get estimated delivery time based on status
  const getEstimatedTime = (): string => {
    if (!order) return "";
    
    switch (order.status) {
      case 'pending':
        return "10-15 minutes";
      case 'preparing':
        return "5-7 minutes";
      case 'ready':
        return "Ready now!";
      default:
        return "10 minutes";
    }
  };
  
  // Loading state or Order not found state
  const [isLoadingRetry, setIsLoadingRetry] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use an effect to retry loading the order more aggressively at first
  useEffect(() => {
    // If order is loaded or we've reached our retry limit, we're done
    if (order) {
      setIsLoadingRetry(false);
      return;
    }
    
    // Limit to 8 total manual retries, with delay increasing each time
    if (retryCount >= 8) {
      setIsLoadingRetry(false);
      return;
    }
    
    // Calculate delay with exponential backoff: 500ms, 1s, 2s, 4s, etc, max 10s
    const delay = Math.min(500 * Math.pow(2, retryCount), 10000);
    
    console.log(`Retry attempt ${retryCount + 1} for order ${orderId}, waiting ${delay}ms...`);
    
    // Retry with increasing delay
    const timer = setTimeout(() => {
      // Try to fetch the order directly
      refetch().then(result => {
        if (result.data) {
          console.log(`Successfully retrieved order ${orderId} on retry ${retryCount + 1}`);
          setIsLoadingRetry(false);
        } else {
          // Also invalidate query cache
          queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
          setRetryCount(prev => prev + 1);
        }
      }).catch(() => {
        // Also invalidate other related queries
        queryClient.invalidateQueries({ queryKey: [`/api/orders`] });
        setRetryCount(prev => prev + 1);
      });
    }, delay);
    
    return () => clearTimeout(timer);
  }, [order, retryCount, queryClient, orderId, refetch]);
  
  // Show loading state while trying to find the order
  if ((isLoadingOrder || isLoadingRetry) && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-t-[#FF5722] border-b-[#FF5722] border-l-transparent border-r-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Processing Order</h2>
          <p className="text-gray-500 mb-6">Your order is being processed. Please wait a moment...</p>
        </div>
      </div>
    );
  }
  
  // Order not found state after loading attempts
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-6">We couldn't find the order you're looking for. It may have been deleted or the order ID is incorrect.</p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => navigate("/")}
              className="py-3 px-6 bg-gradient-to-r from-[#FF5722] to-[#FF7043] text-white rounded-xl font-medium flex items-center justify-center">
              <Home className="w-4 h-4 mr-2" />
              Return to Menu
            </button>
            <button 
              onClick={() => window.history.back()}
              className="py-3 px-6 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <section className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Bar */}
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <button 
            onClick={handleBackToHome}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span>Back to Menu</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Order Confirmation</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </header>
      
      <div className="container mx-auto px-4 flex-1 flex flex-col items-center py-10">
        <div className="bg-white w-full max-w-md rounded-xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-6 mx-auto">
            <CheckCircle className="w-10 h-10 text-[#4CAF50]" />
          </div>
          
          <h1 className="font-semibold text-2xl text-gray-800 mb-2">Order #{order.id} Confirmed!</h1>
          
          <div className="bg-[#E3F2FD] text-[#2196F3] text-lg py-3 px-4 rounded-lg flex items-center justify-center mb-4 font-bold">
            <span>Table #{order.table?.tableNumber || tableNumber}</span>
          </div>
          
          <div className="bg-[#FFF3E0] text-[#FF9800] text-sm py-2 px-3 rounded-lg inline-flex items-center mb-6">
            <span>Estimated Time: {getEstimatedTime()}</span>
          </div>
          
          <p className="text-gray-600 mb-4">
            Your order has been received and sent to our kitchen. We'll notify you when it's ready.
          </p>
          
          {order.customerPhone && (
            <div className="mb-6 mt-4 bg-gray-50 rounded-lg p-4 inline-flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-[#FF5722]" />
              <span>WhatsApp updates will be sent to: {order.customerPhone}</span>
            </div>
          )}
        </div>
        
        {/* Order status card */}
        <OrderStatusCard order={order} />
        
        <div className="mt-8 w-full max-w-md">
          <button 
            onClick={handlePlaceAnotherOrder} 
            className="w-full py-3.5 px-6 bg-gradient-to-r from-[#FF5722] to-[#FF7043] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-shadow flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Place Another Order
          </button>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Thank you for dining with us! Your order is being prepared with care.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
