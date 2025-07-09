import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Restaurant } from '@shared/schema';
import { useAuth } from '@/context/AuthContext';
import { 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  Utensils, 
  Filter, 
  LogOut, 
  User, 
  FileText, 
  MenuSquare,
  ChevronRight,
  ChefHat
} from 'lucide-react';

// Cuisine types for better categorization
const CUISINE_TYPES = [
  'All Cuisines',
  'Italian',
  'Indian', 
  'Chinese', 
  'Fast Food', 
  'Mexican',
  'Thai'
];

export default function RestaurantList() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All Cuisines');
  
  // Fetch all restaurants
  const { data: restaurants = [], isLoading, error } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // No longer auto-selecting a restaurant, even if only one exists
  // This allows users to always see the restaurant list first
  
  // Valid restaurant IDs in our system
  const validRestaurantIds = [2, 3, 5, 6];
  
  const handleCustomerView = (restaurant: Restaurant) => {
    // Validate restaurant ID before storing it
    if (validRestaurantIds.includes(restaurant.id)) {
      // Store selected restaurant in localStorage for customer
      localStorage.setItem('selectedRestaurant', restaurant.id.toString());
      // Navigate to menu
      navigate('/menu');
    } else {
      console.error('Invalid restaurant ID:', restaurant.id);
      // Show error toast and stay on restaurant list
      // This should not happen under normal circumstances since we're selecting from the restaurant list
    }
  };

  const handleChefLogin = (restaurant: Restaurant) => {
    // Validate restaurant ID before storing it
    if (validRestaurantIds.includes(restaurant.id)) {
      // Store selected restaurant in localStorage for chef
      localStorage.setItem('selectedRestaurant', restaurant.id.toString());
      // Navigate to chef login
      navigate('/chef/login');
    } else {
      console.error('Invalid restaurant ID:', restaurant.id);
      // This should not happen under normal circumstances since we're selecting from the restaurant list
    }
  };

  // Filter restaurants based on search term and cuisine
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = searchTerm === '' || 
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCuisine = selectedCuisine === 'All Cuisines' || 
      (restaurant.id % 2 === 0 ? 'Italian' : 'Indian') === selectedCuisine;
    
    return matchesSearch && matchesCuisine;
  });

  // Generate random estimated wait time based on restaurant ID
  const getEstimatedWaitTime = (restaurantId: number) => {
    return 10 + (restaurantId * 7) % 20; // 10-29 minutes
  };
  
  // Handle user logout
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-t-4 border-[#FF5722] border-solid rounded-full animate-spin mb-6"></div>
        <h2 className="text-lg font-medium text-gray-600">Loading restaurants...</h2>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-6">
            <i className="ri-error-warning-line text-red-500 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">Error Loading Restaurants</h2>
          <p className="text-gray-600 mb-6 text-center">
            We encountered an error while loading the restaurant list. Please try again later.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-gradient-to-r from-[#FF5722] to-[#FF7043] text-white rounded-lg font-medium shadow-md hover:shadow-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with account section */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF5722] to-[#FF8A65] rounded-full flex items-center justify-center shadow-sm">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <div className="ml-2.5">
                <h1 className="font-semibold text-lg text-gray-800">Scan2Order</h1>
                <p className="text-[10px] text-gray-500 -mt-1">Dine smart, order easy</p>
              </div>
            </div>
            
            {/* Prominent Chef Login Button and Admin Link- Always Visible */}
            <div className="mx-auto flex space-x-3">
              <button
                onClick={() => navigate('/chef/login')}
                className="bg-gradient-to-r from-[#FF5722] to-[#FF7043] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:shadow-md transition-all duration-300 flex items-center"
              >
                <ChefHat className="w-4 h-4 mr-2" />
                <span>Chef Login</span>
              </button>
              
              <button
                onClick={() => navigate('/auth')}
                className="bg-blue-50 text-blue-600 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-100 transition-all duration-300 flex items-center"
              >
                <User className="w-4 h-4 mr-2" />
                <span>Admin</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-5">
              {user ? (
                <div className="flex items-center">
                  <div className="mr-6 relative group">
                    <button className="flex items-center text-gray-700 hover:text-gray-900">
                      <User className="w-5 h-5" />
                      <span className="ml-2 font-medium text-sm hidden sm:inline-block">
                        {isNaN(Number(user.username)) ? user.username : "Account"}
                      </span>
                    </button>
                    <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg py-2 w-48 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-700">
                          {user.username}
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate('/customer/orders')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <FileText className="w-4 h-4 mr-2 text-gray-500" />
                        My Orders
                      </button>
                      <button 
                        onClick={() => navigate('/tracking-order')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <Search className="w-4 h-4 mr-2 text-gray-500" />
                        Track Orders by Phone
                      </button>
                      <button 
                        onClick={() => navigate('/chef/login')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <ChefHat className="w-4 h-4 mr-2 text-gray-500" />
                        Chef Login
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-2 text-gray-500" />
                        Logout
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/customer/orders')}
                    className="bg-[#FF5722] bg-opacity-10 text-[#FF5722] text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-opacity-20 transition-colors flex items-center"
                  >
                    <FileText className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">My Orders</span>
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate('/tracking-order')}
                    className="bg-[#FF5722] bg-opacity-10 text-[#FF5722] text-sm font-medium px-3 py-2 rounded-lg hover:bg-opacity-20 transition-colors flex items-center"
                  >
                    <Search className="w-4 h-4 mr-1.5" />
                    <span>Track Order</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Search and Filter Bar */}
      <div className="fixed top-[60px] left-0 right-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search Input */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search restaurants, cuisines, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition"
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
            
            {/* Cuisine Filter */}
            <div className="relative min-w-[180px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition"
              >
                {CUISINE_TYPES.map(cuisine => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine}
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Restaurants Near You</h2>
            <p className="text-gray-500 mt-1">
              {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants'} available
            </p>
          </div>
          {searchTerm || selectedCuisine !== 'All Cuisines' ? (
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCuisine('All Cuisines');
              }}
              className="text-sm text-[#FF5722] font-medium flex items-center"
            >
              <i className="ri-filter-off-line mr-1.5"></i>
              Clear Filters
            </button>
          ) : null}
        </div>
        
        {/* Restaurant Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.map((restaurant) => {
              // For demo purposes, generate the cuisine type based on ID
              const cuisineType = restaurant.id % 2 === 0 ? 'Italian' : 'Indian';
              // Generate a random rating between 3.5 and 5.0
              const rating = (3.5 + (restaurant.id * 0.3) % 1.5).toFixed(1);
              
              return (
                <div 
                  key={restaurant.id} 
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition transform hover:translate-y-[-4px] duration-300 group cursor-pointer"
                  onClick={() => handleCustomerView(restaurant)}
                >
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    <img 
                      src={restaurant.id % 2 === 0 ? 
                        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=500' : 
                        'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=500'}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute top-3 right-3 bg-white/95 rounded-full py-1 px-3 shadow-md flex items-center">
                      <Clock className="w-3 h-3 text-[#FF5722] mr-1" />
                      <span className="text-xs font-medium">Open Now</span>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-[#FF5722]/90 text-white rounded-lg py-1 px-2.5 shadow-md text-xs font-medium">
                      {getEstimatedWaitTime(restaurant.id)}-{getEstimatedWaitTime(restaurant.id) + 10} min
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-gray-800 group-hover:text-[#FF5722] transition line-clamp-1">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center text-amber-400 bg-amber-50 px-2 py-0.5 rounded">
                        <Star className="w-3.5 h-3.5 fill-current mr-1" />
                        <span className="text-xs font-semibold">{rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-1 mb-3">
                      <span className="bg-[#FFF3E0] text-[#FF5722] px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {cuisineType}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        {restaurant.id % 2 === 0 ? '$$' : '$$$'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600 flex items-start">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1.5 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{restaurant.address}</span>
                      </p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-1.5 flex-shrink-0" />
                        <span>{restaurant.phone}</span>
                      </p>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex justify-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent the card click from triggering
                            handleCustomerView(restaurant);
                          }} 
                          className="bg-gradient-to-r from-[#FF5722] to-[#FF7043] text-white py-2 px-8 rounded-lg font-medium shadow-sm hover:shadow-md transition flex items-center justify-center"
                        >
                          <MenuSquare className="w-4 h-4 mr-1.5" />
                          <span>View Menu</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 px-6 text-center bg-white rounded-xl shadow-sm">
              <div className="w-20 h-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <i className="ri-restaurant-line text-3xl text-gray-300"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Restaurants Found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {searchTerm || selectedCuisine !== 'All Cuisines' 
                  ? "We couldn't find any restaurants matching your search criteria. Try adjusting your filters or search term." 
                  : "No restaurants are available at the moment. Please check back later."}
              </p>
              {(searchTerm || selectedCuisine !== 'All Cuisines') && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCuisine('All Cuisines');
                  }}
                  className="py-2.5 px-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}