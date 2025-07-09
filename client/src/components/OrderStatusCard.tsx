import { OrderWithItems } from "@shared/schema";
import { CheckCircle, Clock, Utensils, ShoppingBag, MapPin } from "lucide-react";

interface OrderStatusCardProps {
  order: OrderWithItems;
}

export default function OrderStatusCard({ order }: OrderStatusCardProps) {
  // Format order date/time
  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate estimated wait time (in minutes)
  const getEstimatedTime = (status: string): number => {
    switch (status) {
      case 'pending':
        return 15;
      case 'preparing':
        return 7;
      case 'ready':
        return 0;
      default:
        return 10;
    }
  };
  
  // Get status CSS classes
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#FFF3E0] text-[#FF9800]';
      case 'preparing':
        return 'bg-[#E8F5E9] text-[#4CAF50]';
      case 'ready':
        return 'bg-[#E3F2FD] text-[#2196F3]';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  // Get color for step
  const getStepColor = (stepStatus: string, orderStatus: string) => {
    if (stepStatus === 'received') return 'text-[#4CAF50]';
    if (stepStatus === 'preparing' && (orderStatus === 'preparing' || orderStatus === 'ready')) return 'text-[#4CAF50]';
    if (stepStatus === 'ready' && orderStatus === 'ready') return 'text-[#2196F3]';
    return 'text-gray-400';
  };
  
  // Get step completion status
  const isStepComplete = (stepStatus: string, orderStatus: string) => {
    if (stepStatus === 'received') return true;
    if (stepStatus === 'preparing' && (orderStatus === 'preparing' || orderStatus === 'ready')) return true;
    if (stepStatus === 'ready' && orderStatus === 'ready') return true;
    return false;
  };
  
  return (
    <div className="w-full max-w-md bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-8">
      {/* Header with order info */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="text-sm text-gray-500">
            Order #{order.restaurantOrderNumber || order.id}
            {order.restaurant && (
              <span className="ml-2 text-xs text-[#FF5722]">{order.restaurant.name}</span>
            )}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(order.status)} flex items-center`}>
            {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
            {order.status === 'preparing' && <Utensils className="w-3 h-3 mr-1" />}
            {order.status === 'ready' && <ShoppingBag className="w-3 h-3 mr-1" />}
            <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
          </span>
        </div>
      </div>
      
      {/* Prominent table number display */}
      <div className="bg-[#E3F2FD] text-[#2196F3] py-3 px-4 rounded-lg flex items-center justify-center mb-4 border border-[#BBDEFB]">
        <MapPin className="w-5 h-5 mr-2 text-[#2196F3]" />
        <span className="text-lg font-bold">Table #{order.table?.tableNumber || '?'}</span>
      </div>
      
      <div className="flex justify-end">
        <span className="text-xs text-gray-500 mt-1">{formatTime(new Date(order.timestamp))}</span>
      </div>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`absolute h-full left-0 top-0 rounded-full transition-all duration-500 ${
              order.status === 'pending' ? 'bg-[#FF9800] w-1/3' : 
              order.status === 'preparing' ? 'bg-[#4CAF50] w-2/3' : 
              'bg-[#2196F3] w-full'
            }`}
          ></div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>Ordered</span>
          <span>Preparing</span>
          <span>Ready</span>
        </div>
      </div>
      
      {/* Status timeline */}
      <div className="flex flex-col gap-5 relative mb-6">
        {/* Vertical line connecting steps */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100"></div>
        
        {/* Step 1: Order Received */}
        <div className="flex items-start relative z-10">
          <div className="bg-white pt-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isStepComplete('received', order.status) 
                ? 'bg-[#E8F5E9] text-[#4CAF50]' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="ml-4">
            <h4 className="font-medium text-gray-800">Order Received</h4>
            <p className="text-sm text-gray-500 mt-0.5">Your order has been sent to the kitchen</p>
            <span className="text-xs text-gray-400 mt-1 block">{formatTime(new Date(order.timestamp))}</span>
          </div>
        </div>
        
        {/* Step 2: Preparing */}
        <div className="flex items-start relative z-10">
          <div className="bg-white pt-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isStepComplete('preparing', order.status) 
                ? 'bg-[#E8F5E9] text-[#4CAF50]' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {isStepComplete('preparing', order.status) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Utensils className="w-5 h-5" />
              )}
            </div>
          </div>
          <div className="ml-4">
            <h4 className={`font-medium ${isStepComplete('preparing', order.status) ? 'text-gray-800' : 'text-gray-500'}`}>
              Preparing
            </h4>
            <p className={`text-sm ${isStepComplete('preparing', order.status) ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>
              The chef is working on your delicious meal
            </p>
            {order.status === 'preparing' && (
              <div className="mt-2 bg-[#E8F5E9] text-[#4CAF50] text-xs py-1 px-2 rounded inline-flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <span>Est. ready in {getEstimatedTime(order.status)} minutes</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Step 3: Ready for Pickup */}
        <div className="flex items-start relative z-10">
          <div className="bg-white pt-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isStepComplete('ready', order.status) 
                ? 'bg-[#E3F2FD] text-[#2196F3]' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {isStepComplete('ready', order.status) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <ShoppingBag className="w-5 h-5" />
              )}
            </div>
          </div>
          <div className="ml-4">
            <h4 className={`font-medium ${isStepComplete('ready', order.status) ? 'text-gray-800' : 'text-gray-500'}`}>
              Ready for Pickup
            </h4>
            <p className={`text-sm ${isStepComplete('ready', order.status) ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>
              Collect your order from the counter
            </p>
            {order.status === 'ready' && (
              <div className="mt-2 bg-[#E3F2FD] text-[#2196F3] text-xs py-1 px-2 rounded inline-flex items-center">
                <ShoppingBag className="w-3 h-3 mr-1" />
                <span>Ready now! Please collect your order</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Order summary - only show if we have items */}
      {order.items && order.items.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-medium text-gray-800 mb-3">Order Summary</h3>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex">
                  <span className="font-medium text-gray-700">{item.quantity}×</span>
                  <span className="ml-2 text-gray-800">{item.menuItem?.name || 'Unknown item'}</span>
                </div>
                <span className="font-medium text-gray-700">${((item.price * item.quantity) / 100).toFixed(2)}</span>
              </div>
            ))}
            
            {order.totalAmount > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between font-semibold">
                <span className="text-gray-800">Total</span>
                <span className="text-[#FF5722]">${(order.totalAmount / 100).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
