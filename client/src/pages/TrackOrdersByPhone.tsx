import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Search, History, ArrowLeft, Phone, Shield, CheckCircle2 } from "lucide-react";
import OrderStatusCard from "@/components/OrderStatusCard";
import { Link, useLocation } from "wouter";
import { OrderWithItems } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import PhoneVerification from "@/components/PhoneVerification";

export default function TrackOrdersByPhone() {
  const [, navigate] = useLocation();
  const [phoneNumber, setPhoneNumber] = useState(() => {
    // Try to get the verified phone from local storage for automatic tracking
    return localStorage.getItem("verifiedPhone") || "";
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(() => {
    // If we have a verified phone in localStorage, consider it verified
    const storedPhone = localStorage.getItem("verifiedPhone");
    return storedPhone === phoneNumber && !!phoneNumber;
  });
  
  // Auto-search if we have a verified phone number from a previous order
  useEffect(() => {
    if (phoneNumber && isPhoneVerified) {
      // Auto-search with the verified phone number
      setHasSearched(true);
    }
  }, [phoneNumber, isPhoneVerified]);
  
  // Phone number search query - disabled by default, enabled when searching
  const { data: orders = [], isLoading, isError, error } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/customer/orders/phone", phoneNumber],
    queryFn: async () => {
      if (!phoneNumber) return [];
      
      const response = await fetch(`/api/customer/orders/phone/${encodeURIComponent(phoneNumber)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      return response.json();
    },
    enabled: hasSearched && !!phoneNumber && isPhoneVerified, // Only run when search is triggered and phone is verified
    staleTime: 30000 // Refresh data every 30 seconds for updates
  });
  
  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest("POST", "/api/verify-phone/send-otp", { phoneNumber: phone });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification Code Sent",
        description: "We've sent a verification code to your phone number",
      });
      setNeedsVerification(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send verification code",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle phone number input change
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setPhoneNumber(newPhone);
    
    // Reset verification status if phone number changes
    if (newPhone !== localStorage.getItem("verifiedPhone")) {
      setIsPhoneVerified(false);
    } else {
      setIsPhoneVerified(true);
    }
  };
  
  // Handle verification complete
  const handleVerificationComplete = () => {
    setIsPhoneVerified(true);
    setNeedsVerification(false);
    localStorage.setItem("verifiedPhone", phoneNumber);
    setHasSearched(true);
  };
  
  // Handle verification cancel
  const handleVerificationCancel = () => {
    setNeedsVerification(false);
  };
  
  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number to find your orders",
        variant: "destructive"
      });
      return;
    }
    
    // If phone is already verified (from localStorage), search directly
    if (isPhoneVerified) {
      setHasSearched(true);
      return;
    }
    
    // Otherwise, start verification process
    sendOtpMutation.mutate(phoneNumber);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Track Orders</h1>
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Phone Verification Modal */}
          {needsVerification && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Verify Your Phone</h3>
                  <p className="text-gray-600 mt-1">
                    Please verify your phone number to view your orders
                  </p>
                </div>
                
                <PhoneVerification 
                  phoneNumber={phoneNumber}
                  onVerified={handleVerificationComplete}
                  onCancel={handleVerificationCancel}
                />
              </div>
            </div>
          )}
          
          {/* Hero section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="h-8 w-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Track Your Orders</h2>
            <p className="text-gray-600 mb-4">
              Enter your phone number to see all your past and current orders across all our partner restaurants.
            </p>
            
            {/* Phone verification status indicator */}
            {phoneNumber && isPhoneVerified && (
              <div className="flex items-center justify-center mb-4 bg-green-50 text-green-700 rounded-lg p-3 text-sm">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                <p>Phone number verified. You can search for your orders.</p>
              </div>
            )}
            
            {phoneNumber && !isPhoneVerified && (
              <div className="flex items-center justify-center mb-4 bg-amber-50 text-amber-700 rounded-lg p-3 text-sm">
                <Shield className="h-5 w-5 mr-2 text-amber-500" />
                <p>You'll need to verify this phone number before viewing orders.</p>
              </div>
            )}
            
            {/* Search form */}
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  className="pl-10 w-full rounded-lg border border-gray-300 py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Your phone number"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                />
              </div>
              <button
                type="submit"
                disabled={sendOtpMutation.isPending}
                className="bg-gradient-to-r from-[#FF5722] to-[#FF7043] text-white rounded-lg px-4 py-3 font-medium flex items-center justify-center min-w-[100px] disabled:opacity-70"
              >
                {isLoading || sendOtpMutation.isPending ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    {isPhoneVerified ? "Search" : "Verify & Search"}
                  </>
                )}
              </button>
            </form>
          </div>
          
          {/* Results section */}
          {hasSearched && (
            <div className="mt-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 border-4 border-gray-200 border-t-[#FF5722] rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500">Searching for your orders...</p>
                </div>
              ) : isError ? (
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-red-600">Error: {error instanceof Error ? error.message : "Failed to load orders"}</p>
                  <button
                    onClick={() => setHasSearched(true)} // Re-trigger search
                    className="mt-2 text-red-600 underline hover:text-red-800"
                  >
                    Try again
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                  <p className="text-gray-500 mb-4">No orders found for this phone number.</p>
                  <p className="text-sm text-gray-400">
                    Please check your phone number or place an order first.
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Found {orders.length} order{orders.length !== 1 ? "s" : ""}
                  </h3>
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">Order #{order.id}</span>
                              <span className="ml-2 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                                {order.restaurant?.name || "Restaurant"}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(order.timestamp).toLocaleDateString()} at {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                        
                        <OrderStatusCard order={order} />
                        
                        <div className="px-4 py-3 border-t border-gray-100 text-center">
                          <Link to={`/order/confirmation/${order.id}`} className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                            View Order Details →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}