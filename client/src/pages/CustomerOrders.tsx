import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { OrderWithItems } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  ChevronLeft, 
  ShoppingBag, 
  Filter, 
  Clock, 
  MapPin, 
  FileText, 
  Store, 
  PackageCheck, 
  AlertCircle, 
  CheckCircle2,
  Coffee,
  ClipboardList,
  ExternalLink,
  Search,
  RefreshCcw
} from 'lucide-react';

const STATUS_FILTERS = [
  'All Orders',
  'Active Orders',
  'Completed Orders'
];

export default function CustomerOrders() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isLoadingAuth, logout } = useAuth();
  const [statusFilter, setStatusFilter] = useState('All Orders');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Track manual refresh state
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  
  // Fetch customer orders with more frequent refreshing
  const { data: orders = [], isLoading: isLoadingOrders, refetch, isRefetching } = useQuery<OrderWithItems[]>({
    queryKey: ['/api/customer/orders'],
    enabled: !!user,
    staleTime: 2000, // 2 seconds - allow more frequent refreshes 
    refetchInterval: 8000 // Auto-refresh every 8 seconds
  });
  
  // Handle manual refresh with debounce
  const handleManualRefresh = async () => {
    if (isManualRefreshing || isRefetching) return;
    
    setIsManualRefreshing(true);
    try {
      await refetch();
      toast({
        title: 'Orders Refreshed',
        description: 'Your latest orders have been loaded',
        variant: "default",
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh orders, please try again',
        variant: "destructive",
      });
    } finally {
      // Add a slight delay to prevent rapid clicking
      setTimeout(() => {
        setIsManualRefreshing(false);
      }, 1000);
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#FFF3E0] text-[#FF9800]';
      case 'preparing':
        return 'bg-[#E8F5E9] text-[#4CAF50]';
      case 'ready':
        return 'bg-[#E3F2FD] text-[#2196F3]';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3.5 h-3.5 mr-1" />;
      case 'preparing':
        return <Coffee className="w-3.5 h-3.5 mr-1" />;
      case 'ready':
        return <PackageCheck className="w-3.5 h-3.5 mr-1" />;
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      case 'cancelled':
        return <AlertCircle className="w-3.5 h-3.5 mr-1" />;
      default:
        return <FileText className="w-3.5 h-3.5 mr-1" />;
    }
  };
  
  const formatOrderDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  const formatOrderTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };
  
  const getPrettyStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for Pickup';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Determine if an order is "active" - not completed or cancelled
  const isActiveOrder = (status: string) => {
    return status !== 'completed' && status !== 'cancelled';
  };
  
  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      // Status filter
      if (statusFilter === 'Active Orders' && !isActiveOrder(order.status)) {
        return false;
      }
      if (statusFilter === 'Completed Orders' && isActiveOrder(order.status)) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const restaurantMatch = order.restaurant?.name?.toLowerCase().includes(searchLower);
        const itemsMatch = order.items.some(item => 
          item.menuItem?.name?.toLowerCase().includes(searchLower)
        );
        const orderIdMatch = order.id.toString().includes(searchLower);
        
        return restaurantMatch || itemsMatch || orderIdMatch;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort active orders first, then by date descending
      const aIsActive = isActiveOrder(a.status);
      const bIsActive = isActiveOrder(b.status);
      
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      
      // For same status group, sort by date (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  
  const activeOrdersCount = orders.filter(order => isActiveOrder(order.status)).length;
  
  const isLoading = isLoadingAuth || isLoadingOrders;
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-t-4 border-[#FF5722] border-solid rounded-full animate-spin mb-6"></div>
        <h2 className="text-lg font-medium text-gray-600">Loading your orders...</h2>
      </div>
    );
  }
  
  if (!user) {
    // Redirect to login if not authenticated
    navigate('/customer/login');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/')}
                className="w-10 h-10 bg-gradient-to-br from-[#FF5722] to-[#FF8A65] rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
              >
                <ShoppingBag className="w-5 h-5 text-white" />
              </button>
              <div className="ml-3">
                <h1 className="font-semibold text-lg text-gray-800">Your Orders</h1>
                <p className="text-xs text-gray-500">Track all your orders in one place</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleManualRefresh}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                title="Refresh orders"
                disabled={isManualRefreshing || isRefetching}
              >
                <RefreshCcw className={`w-5 h-5 ${(isManualRefreshing || isRefetching) ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => navigate('/')}
                className="hidden sm:flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Back to Restaurants</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gradient-to-r from-[#FF5722] to-[#FF7043] text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition flex items-center"
              >
                <i className="ri-add-line mr-1.5"></i>
                <span>New Order</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Search and filter bar */}
      <div className="fixed top-[60px] left-0 right-0 z-[5] bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search Input */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by restaurant, order items, or order number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line"></i>
                </button>
              )}
            </div>
            
            {/* Status Filter */}
            <div className="relative min-w-[180px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition"
              >
                {STATUS_FILTERS.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <i className="ri-arrow-down-s-line text-gray-400"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 pt-[130px] pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <ClipboardList className="w-5 h-5 mr-2 text-[#FF5722]" />
              Order History
              {activeOrdersCount > 0 && (
                <span className="ml-2 bg-[#FF5722] text-white text-xs px-2 py-0.5 rounded-full">
                  {activeOrdersCount} active
                </span>
              )}
            </h2>
            <p className="text-gray-500 mt-1">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} {searchTerm ? 'found' : 'total'}
            </p>
          </div>
          {(searchTerm || statusFilter !== 'All Orders') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All Orders');
              }}
              className="text-sm text-[#FF5722] font-medium flex items-center mt-2 sm:mt-0"
            >
              <i className="ri-filter-off-line mr-1.5"></i>
              Clear Filters
            </button>
          )}
        </div>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't placed any orders yet. Browse our restaurants and place your first order!
            </p>
            <button
              onClick={() => navigate('/')}
              className="py-2.5 px-6 bg-gradient-to-r from-[#FF5722] to-[#FF7043] text-white rounded-lg font-medium shadow-sm hover:shadow-md transition flex items-center mx-auto"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Browse Restaurants
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Orders Match Your Filters</h3>
            <p className="text-gray-600 mb-5">
              We couldn't find any orders matching your current filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All Orders');
              }}
              className="py-2 px-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOrders.map((order) => {
              // Determine if this is an active order
              const isActive = isActiveOrder(order.status);
              
              return (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition hover:shadow-md ${
                    order.status === 'ready' ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                  }`}
                >
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="flex flex-col">
                          <h3 className="font-semibold text-gray-800">Order #{order.id}</h3>
                          <div className="flex items-center mt-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">
                              {formatOrderDate(order.timestamp)} • {formatOrderTime(order.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${getStatusClass(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {getPrettyStatus(order.status)}
                        </span>
                        {order.status === 'pending' && (
                          <span className="text-xs text-gray-500 mt-1">Awaiting confirmation</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="flex items-center">
                        <Store className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="font-medium text-gray-800">{order.restaurant?.name || 'Restaurant'}</span>
                      </div>
                      <div className="flex items-center mt-1.5">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">Table #{order.table?.tableNumber}</span>
                      </div>
                    </div>
                    
                    {/* Order items preview */}
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-700 font-medium flex items-center">
                        <ShoppingBag className="w-4 h-4 text-gray-400 mr-1.5" />
                        Order Summary ({order.items.length} {order.items.length === 1 ? 'item' : 'items'}):
                      </div>
                      
                      <div className="max-h-24 overflow-y-auto pr-2 scrollbar-thin">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex justify-between py-1">
                            <div className="flex items-baseline">
                              <span className="text-xs font-medium bg-gray-100 text-gray-800 rounded px-1.5 py-0.5 mr-2">
                                {item.quantity}×
                              </span>
                              <span className="text-sm">{item.menuItem?.name}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              ${((item.price * item.quantity) / 100).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        
                        {order.items.length > 3 && (
                          <div className="text-xs text-gray-500 italic mt-1">
                            +{order.items.length - 3} more {order.items.length - 3 === 1 ? 'item' : 'items'}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total</span>
                      <span className="font-bold text-[#FF5722]">
                        ${(order.totalAmount / 100).toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => navigate(`/order/confirmation/${order.id}`)}
                        className="text-[#FF5722] text-sm font-medium hover:underline flex items-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-1.5" />
                        Track Order
                      </button>
                      
                      {order.status === 'ready' && (
                        <div className="flex items-center bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg">
                          <PackageCheck className="w-4 h-4 mr-1.5" />
                          <span className="text-xs font-medium">Ready for Pickup!</span>
                        </div>
                      )}
                      
                      {order.status === 'preparing' && (
                        <div className="flex items-center bg-green-50 text-green-600 px-3 py-1.5 rounded-lg">
                          <Coffee className="w-4 h-4 mr-1.5" />
                          <span className="text-xs font-medium">Chef is cooking...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Only show this pagination hint when there are many orders */}
        {filteredOrders.length > 4 && (
          <div className="flex justify-center mt-8">
            <p className="text-sm text-gray-500">
              Showing all {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}