import { OrderWithItems } from "@shared/schema";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { 
  Clock, 
  Utensils, 
  CheckCircle2, 
  ShoppingBag, 
  Phone, 
  User, 
  FileText, 
  MessageCircle,
  CheckCheck,
  AlertCircle,
  ChefHat
} from "lucide-react";

interface ChefOrderCardProps {
  order: OrderWithItems;
  onUpdateStatus: (orderId: number, status: string) => void;
}

export default function ChefOrderCard({ order, onUpdateStatus }: ChefOrderCardProps) {
  
  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };
  
  // Format order time
  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate minutes since order was placed
  const getMinutesSinceOrder = () => {
    const orderTime = new Date(order.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - orderTime.getTime();
    return Math.floor(diffMs / 60000);
  };
  
  // Get urgency indicator based on wait time
  const getUrgencyIndicator = () => {
    const minutes = getMinutesSinceOrder();
    if (order.status === 'pending') {
      if (minutes > 10) return 'high';
      if (minutes > 5) return 'medium';
    }
    if (order.status === 'preparing' && minutes > 15) return 'medium';
    return 'normal';
  };
  
  // Get status CSS classes for the pill
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
  
  // Get border color based on status for the card
  const getCardBorderClass = (status: string) => {
    const urgency = getUrgencyIndicator();
    
    if (urgency === 'high') return 'border-l-red-500';
    if (urgency === 'medium') return 'border-l-yellow-500';
    
    switch (status) {
      case 'pending':
        return 'border-l-[#FF9800]';
      case 'preparing':
        return 'border-l-[#4CAF50]';
      case 'ready':
        return 'border-l-[#2196F3]';
      default:
        return 'border-l-neutral-300';
    }
  };
  
  // Get background color based on status
  const getHeaderBgClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#FFF3E0]';
      case 'preparing':
        return 'bg-[#E8F5E9]';
      case 'ready':
        return 'bg-[#E3F2FD]';
      default:
        return 'bg-gray-50';
    }
  };
  
  // Calculate order total
  const getOrderTotal = () => {
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      return 0;
    }
    return order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };
  
  // Remove all prep time and performance module features
  
  // Get status icon
  const getStatusIcon = () => {
    switch (order.status) {
      case 'pending':
        return <Clock className="w-4 h-4 mr-1.5" />;
      case 'preparing':
        return <Utensils className="w-4 h-4 mr-1.5" />;
      case 'ready':
        return <CheckCircle2 className="w-4 h-4 mr-1.5" />;
      default:
        return <FileText className="w-4 h-4 mr-1.5" />;
    }
  };
  
  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-sm border-l-4 transition hover:shadow-md ${getCardBorderClass(order.status)}`}>
      {/* Header with table and status info - Mobile friendly */}
      <div className={`p-3 sm:p-4 border-b ${getHeaderBgClass(order.status)}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center mb-2 sm:mb-0">
            <div className="bg-white border border-gray-200 shadow-sm text-[#FF5722] font-bold rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <span className="text-base sm:text-lg">{order.table?.tableNumber}</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                Table #{order.table?.tableNumber}
                {order.restaurantOrderNumber && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full whitespace-nowrap">
                    Order #{order.restaurantOrderNumber}
                  </span>
                )}
              </h3>
              {order.restaurant && (
                <p className="text-xs text-[#FF5722] font-medium truncate">{order.restaurant.name}</p>
              )}
            </div>
          </div>
          <div className="flex justify-between sm:flex-col sm:items-end">
            <span 
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold flex items-center ${getStatusClass(order.status)}`}>
              {getStatusIcon()}
              <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
            </span>
            <span className="text-xs text-gray-500 mt-0 sm:mt-1">
              {getMinutesSinceOrder() < 1 ? 'Just now' : `${getMinutesSinceOrder()} mins ago`}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div className="flex items-center">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 mr-1" />
            <span className="text-xs sm:text-sm text-gray-700">Order #{order.id}</span>
          </div>
          <span className="text-xs bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-gray-600">
            {formatTime(new Date(order.timestamp))}
          </span>
        </div>
        
        {/* Customer info section - mobile optimized */}
        <div className="mb-3 sm:mb-4">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-gray-500" />
            <span>Customer Details</span>
          </h4>
          
          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
            <div className="flex flex-col space-y-1.5">
              <div className="flex flex-col xs:flex-row xs:items-baseline xs:justify-between">
                <span className="text-xs sm:text-sm text-gray-700 font-medium">{order.customerName}</span>
                <a 
                  href={`tel:${order.customerPhone}`}
                  className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center mt-1 xs:mt-0"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  <span className="text-xs">{order.customerPhone}</span>
                </a>
              </div>
              
              {/* Payment Method */}
              <div className="flex items-center">
                <div className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 text-green-700">
                  <span>
                    {order.paymentMethod 
                      ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)
                      : 'Cash'}
                  </span>
                </div>
              </div>
            </div>
            
            {order.notes && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-start">
                  <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 mt-0.5 mr-1 sm:mr-1.5 flex-shrink-0" />
                  <p className="text-[10px] sm:text-xs text-gray-600 italic break-words">{order.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Order items section - mobile friendly */}
        <div className="mb-3 sm:mb-4">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center">
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-gray-500" />
            <span>Order Items</span>
          </h4>
          
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <li key={item.id} className="flex justify-between items-center p-2 sm:p-3">
                    <div className="flex items-center min-w-0">
                      <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-[#FF5722] bg-opacity-10 text-[#FF5722] rounded-full text-[10px] sm:text-xs font-medium mr-1.5 sm:mr-2 flex-shrink-0">
                        {item.quantity}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">{item.menuItem?.name}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 pl-2 flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))
              ) : (
                <li className="p-2 sm:p-3 text-center text-xs sm:text-sm text-gray-500">No items found</li>
              )}
            </ul>
            
            <div className="p-2 sm:p-3 border-t border-gray-200 bg-white">
              <div className="flex justify-between font-medium">
                <span className="text-xs sm:text-sm text-gray-700">Total:</span>
                <span className="text-xs sm:text-sm text-[#FF5722]">{formatPrice(getOrderTotal())}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action buttons - mobile friendly */}
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-100">
          {order.status === 'pending' && (
            <button 
              onClick={() => onUpdateStatus(order.id, 'preparing')} 
              className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white text-sm sm:text-base font-medium rounded-lg flex items-center justify-center hover:shadow-md transition-shadow focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 focus:outline-none"
            >
              <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
              Start Preparing
            </button>
          )}
          
          {order.status === 'preparing' && (
            <div className="flex flex-col gap-2">
              <a 
                href={getWhatsAppLink(order.customerPhone, `Hi ${order.customerName}, Your order #${order.restaurantOrderNumber || order.id} is ready for pickup! Please collect it from the counter.`)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  // Mark as ready when WhatsApp link is clicked
                  onUpdateStatus(order.id, 'ready');
                }}
                className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-[#2196F3] to-[#1E88E5] text-white text-sm sm:text-base font-medium rounded-lg flex items-center justify-center hover:shadow-md transition-shadow focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none active:scale-[0.98]"
              >
                <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                <span className="text-sm sm:text-base">Mark as Ready & Notify</span>
              </a>
            </div>
          )}
          
          {order.status === 'ready' && (
            <div className="text-center">
              <div className="mb-2 py-1.5 sm:py-2 px-3 sm:px-4 bg-blue-50 text-blue-600 rounded-lg text-xs sm:text-sm inline-flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                <span>Order is ready for pickup</span>
              </div>
              
              <a 
                href={getWhatsAppLink(order.customerPhone, `Hi ${order.customerName}, just a reminder that your order #${order.restaurantOrderNumber || order.id} is ready for pickup! Please collect it from the counter.`)}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-[#FF9800] to-[#FF5722] text-white text-sm sm:text-base font-medium rounded-lg flex items-center justify-center hover:shadow-md transition-shadow focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 focus:outline-none active:scale-[0.98]"
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                <span className="text-sm sm:text-base">Send Reminder</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
