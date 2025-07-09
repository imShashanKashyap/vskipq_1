import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { 
  ShoppingCart, X, Plus, Minus, Trash2, ShoppingBag, 
  ArrowRight, CreditCard, DollarSign, Table as TableIcon, Info
} from "lucide-react";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { cartItems, updateQuantity, removeFromCart, clearCart, customerInfo, updateCustomerInfo } = useCart();
  const { user } = useAuth();
  const [customerForm, setCustomerForm] = useState({
    name: customerInfo.name || "",
    phone: customerInfo.phone || "",
    notes: customerInfo.notes || "",
    tableNumber: localStorage.getItem("tableNumber") || ""
  });
  
  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };
  
  // Calculate cart total
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Calculate items count
  const getItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };
  
  // Pre-fill form with user data if available
  useEffect(() => {
    if (user && user.username) {
      setCustomerForm(prev => ({
        ...prev,
        name: user.username || prev.name
      }));
    }
  }, [user]);
  
  // Handle customer form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Clear cart
      clearCart();
      
      // Close cart
      onClose();
      
      // Navigate to confirmation page
      navigate(`/order/confirmation/${data.id}`);
      
      toast({
        title: "Order placed successfully",
        description: "Your order has been sent to the kitchen!",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle proceed to online payment
  const handleProceedToPayment = () => {
    // Validate form
    if (!customerForm.name || !customerForm.phone || !customerForm.tableNumber) {
      toast({
        title: "Missing information",
        description: "Please provide your table number, name and phone number",
        variant: "destructive"
      });
      return;
    }
    
    // Validate cart has items
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add at least one item to your order",
        variant: "destructive"
      });
      return;
    }
    
    // Save customer information to cart context
    updateCustomerInfo({
      name: customerForm.name,
      phone: customerForm.phone,
      notes: customerForm.notes
    });
    
    // Save table number to localStorage
    const tableNumber = parseInt(customerForm.tableNumber || "1", 10);
    localStorage.setItem("tableNumber", tableNumber.toString());
    
    // Close cart dialog and navigate to payment page
    onClose();
    navigate('/payment');
  };

  // Handle place order
  const handlePlaceOrder = () => {
    // Validate form
    if (!customerForm.name || !customerForm.phone || !customerForm.tableNumber) {
      toast({
        title: "Missing information",
        description: "Please provide your table number, name and phone number",
        variant: "destructive"
      });
      return;
    }
    
    // Validate cart has items
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add at least one item to your order",
        variant: "destructive"
      });
      return;
    }
    
    // Save customer information to cart context
    updateCustomerInfo({
      name: customerForm.name,
      phone: customerForm.phone,
      notes: customerForm.notes
    });
    
    // Get table number from form and save to localStorage
    const tableNumber = parseInt(customerForm.tableNumber || "1", 10);
    localStorage.setItem("tableNumber", tableNumber.toString());
    
    // Get restaurant ID from local storage or current cart items
    const currentRestaurantId = localStorage.getItem("currentRestaurantId");
    const restaurantId = currentRestaurantId ? parseInt(currentRestaurantId, 10) : 
                        (cartItems.length > 0 && cartItems[0].restaurantId ? 
                         cartItems[0].restaurantId : null);
    
    // Prepare order data
    const orderData = {
      tableId: tableNumber,
      restaurantId: restaurantId,
      customerName: customerForm.name,
      customerPhone: customerForm.phone,
      notes: customerForm.notes || null,
      status: "pending",
      totalAmount: getCartTotal(),
      paymentMethod: "cash",
      userId: user?.id || null,
      items: cartItems.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price
      }))
    };
    
    // Place order
    placeOrderMutation.mutate(orderData);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden transition-opacity duration-300">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
      ></div>
      
      {/* Cart sidebar */}
      <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white shadow-xl transform transition-transform duration-300">
        <div className="flex flex-col h-full">
          {/* Cart header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#FFF9F6] to-[#FFF3E0]">
            <div className="flex items-center">
              <ShoppingCart className="w-5 h-5 text-[#FF5722] mr-2" />
              <h2 className="font-semibold text-lg text-gray-900">Your Order</h2>
              {getItemsCount() > 0 && (
                <span className="ml-2 bg-[#FF5722] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {getItemsCount()}
                </span>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-800 bg-white rounded-full p-1.5 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-5">
            {cartItems.length === 0 ? (
              <div className="text-center py-10 px-5 flex flex-col items-center justify-center">
                <div className="bg-gray-50 rounded-full p-5 mb-3">
                  <ShoppingBag className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500 mb-2">Your cart is empty</p>
                <p className="text-gray-400 text-sm max-w-xs">
                  Browse the menu and add some delicious items to your order
                </p>
                <button 
                  onClick={onClose}
                  className="mt-5 flex items-center text-sm text-[#FF5722] hover:text-[#E64A19]"
                >
                  <span>Continue Browsing</span>
                  <ArrowRight size={16} className="ml-1" />
                </button>
              </div>
            ) : (
              <div>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item, index) => (
                    <div key={index} className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm flex items-start relative">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                        <p className="text-[#FF5722] font-medium">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center bg-gray-100 rounded-full p-0.5">
                          <button 
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} className={item.quantity <= 1 ? "text-gray-300" : "text-gray-600"} />
                          </button>
                          <span className="w-8 text-center text-gray-800 font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                          >
                            <Plus size={14} className="text-gray-600" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.menuItemId)}
                          className="ml-2 text-gray-400 hover:text-[#F44336] p-1.5 hover:bg-gray-50 rounded-full"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="absolute -top-1 -right-1 bg-gray-100 text-xs px-1.5 py-0.5 rounded-full">
                        ${((item.price * item.quantity) / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 py-3 px-4 border border-gray-100 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center text-sm text-gray-600 pb-2">
                    <span>Subtotal</span>
                    <span>{formatPrice(getCartTotal())}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 pb-2 border-b border-dashed border-gray-200">
                    <span>Service Fee</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900 pt-2">
                    <span>Total</span>
                    <span className="text-[#FF5722]">{formatPrice(getCartTotal())}</span>
                  </div>
                </div>
                
                {/* Customer info form */}
                <div className="mt-6 bg-white p-4 border border-gray-100 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                    <span>Your Information</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-2">Required</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <label className="block font-medium text-gray-800 mb-1 flex items-center">
                        <TableIcon className="w-4 h-4 mr-1 text-[#FF5722]" />
                        Table Number
                        <span className="ml-1 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Required</span>
                      </label>
                      <input 
                        type="number" 
                        name="tableNumber"
                        value={customerForm.tableNumber}
                        onChange={handleInputChange}
                        className="w-full p-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition font-medium text-lg"
                        placeholder="Your table number"
                        min="1"
                        required
                      />
                      <div className="flex items-start mt-2">
                        <Info className="w-4 h-4 text-amber-600 mr-1 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700">
                          Please enter the table number where you are sitting. 
                          This number should be visible on your table or from the QR code you scanned.
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Name</label>
                      <input 
                        type="text" 
                        name="name"
                        value={customerForm.name}
                        onChange={handleInputChange}
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">WhatsApp Number</label>
                      <input 
                        type="tel" 
                        name="phone"
                        value={customerForm.phone}
                        onChange={handleInputChange}
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition"
                        placeholder="Your WhatsApp number"
                      />
                      <p className="text-xs text-gray-500 mt-1">We'll send order updates via WhatsApp</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Special Instructions (Optional)</label>
                      <textarea 
                        name="notes"
                        value={customerForm.notes}
                        onChange={handleInputChange}
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition"
                        placeholder="Any special requests or allergies?" 
                        rows={2}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Cart footer */}
          <div className="p-5 border-t border-gray-100">
            <div className="mb-3">
              <h3 className="font-medium text-gray-800 mb-2">Payment Methods</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={handlePlaceOrder}
                  disabled={cartItems.length === 0 || placeOrderMutation.isPending}
                  className={`flex items-center justify-center p-3 border rounded-lg transition ${
                    cartItems.length === 0
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      : 'bg-gray-50 border-gray-200 hover:border-[#FF5722] hover:bg-[#FFF3E0]'
                  }`}
                >
                  <DollarSign className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-gray-700 font-medium">Pay Later</span>
                </button>
                <button
                  onClick={handleProceedToPayment}
                  disabled={cartItems.length === 0}
                  className={`flex items-center justify-center p-3 border rounded-lg transition ${
                    cartItems.length === 0
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                      : 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100'
                  }`}
                >
                  <img 
                    src="https://www.paypalobjects.com/webstatic/icon/pp258.png" 
                    alt="PayPal" 
                    className="w-5 h-5 mr-2"
                  />
                  <span className="text-gray-700 font-medium">PayPal</span>
                </button>
              </div>
            </div>
            
            <button 
              onClick={handlePlaceOrder}
              disabled={cartItems.length === 0 || placeOrderMutation.isPending}
              className={`w-full py-3.5 text-white font-medium rounded-xl transition duration-200 flex items-center justify-center ${
                cartItems.length === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#FF5722] to-[#FF7043] hover:from-[#E64A19] hover:to-[#FF5722] shadow-md'
              }`}
            >
              {placeOrderMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Order...
                </span>
              ) : (
                <>
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  <span>{cartItems.length > 0 ? `Place Order (Pay Later) • ${formatPrice(getCartTotal())}` : "Place Order"}</span>
                </>
              )}
            </button>
            
            {cartItems.length > 0 && (
              <button 
                onClick={clearCart}
                className="w-full mt-2 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
