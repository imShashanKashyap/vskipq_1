import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Restaurant, MenuItem, InsertRestaurant, InsertMenuItem } from '@shared/schema';

export default function RestaurantManagement() {
  const [isMatch, params] = useRoute('/admin/restaurants');
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  
  // New restaurant dialog state
  const [showRestaurantDialog, setShowRestaurantDialog] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState<{
    name: string;
    address: string;
    phone: string;
  }>({
    name: '',
    address: '',
    phone: '',
  });
  
  // New menu item dialog state
  const [showMenuItemDialog, setShowMenuItemDialog] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState<{
    name: string;
    description: string;
    price: string;
    category: string;
    image: string;
  }>({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
  });
  
  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, authLoading, navigate]);
  
  // Fetch restaurants
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiRequest('GET', '/api/restaurants');
        if (response.ok) {
          const data = await response.json();
          setRestaurants(data);
          // Select the first restaurant by default
          if (data.length > 0 && !selectedRestaurantId) {
            setSelectedRestaurantId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user, selectedRestaurantId]);
  
  // Fetch menu items for selected restaurant
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!selectedRestaurantId) return;
      
      try {
        const response = await apiRequest('GET', `/api/menu-items?restaurantId=${selectedRestaurantId}`);
        if (response.ok) {
          const data = await response.json();
          setMenuItems(data);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };
    
    if (selectedRestaurantId) {
      fetchMenuItems();
    }
  }, [selectedRestaurantId]);
  
  // Create new restaurant
  const handleCreateRestaurant = async () => {
    try {
      // Validate form
      if (!newRestaurant.name || !newRestaurant.address || !newRestaurant.phone) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      // Show loading toast
      toast({
        title: 'Creating Restaurant',
        description: 'Please wait while we set up your new restaurant...',
      });
      
      const response = await apiRequest('POST', '/api/restaurants', newRestaurant);
      
      if (response.ok) {
        const createdRestaurant = await response.json();
        
        // Add to local state
        setRestaurants(prevRestaurants => [...prevRestaurants, createdRestaurant]);
        
        // Reset form and close dialog
        setShowRestaurantDialog(false);
        setNewRestaurant({
          name: '',
          address: '',
          phone: '',
        });
        
        // Show success message
        toast({
          title: 'Success!',
          description: `${createdRestaurant.name} has been added successfully`,
        });
        
        // Select the newly created restaurant
        setSelectedRestaurantId(createdRestaurant.id);
      } else {
        // Try to parse error message from response
        let errorMessage = 'Failed to create restaurant';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating restaurant:', error);
      toast({
        title: 'Connection Error',
        description: 'Could not connect to the server. Please check your network and try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Create new menu item
  const handleCreateMenuItem = async () => {
    if (!selectedRestaurantId) {
      toast({
        title: 'Error',
        description: 'Please select a restaurant first',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Validate form
      if (!newMenuItem.name || !newMenuItem.price || !newMenuItem.category) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in required fields (name, price, category)',
          variant: 'destructive',
        });
        return;
      }
      
      const menuItemData = {
        ...newMenuItem,
        price: parseFloat(newMenuItem.price),
        restaurantId: selectedRestaurantId,
      };
      
      const response = await apiRequest('POST', '/api/menu-items', menuItemData);
      if (response.ok) {
        const createdMenuItem = await response.json();
        setMenuItems([...menuItems, createdMenuItem]);
        setShowMenuItemDialog(false);
        setNewMenuItem({
          name: '',
          description: '',
          price: '',
          category: '',
          image: '',
        });
        
        toast({
          title: 'Menu Item Created',
          description: `${createdMenuItem.name} has been added successfully`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create menu item',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating menu item:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };
  
  // Loading state
  if (authLoading || (loading && !restaurants.length)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-orange-600">Restaurant Management</h1>
        <Button onClick={() => navigate('/admin')} variant="outline" className="border-orange-200 text-orange-600">
          Back to Admin Home
        </Button>
      </div>
      
      {/* Add Restaurant Hero Section */}
      <div className="mb-8 bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0 md:mr-8">
            <h2 className="text-2xl font-bold text-orange-700 mb-2">Add a New Restaurant</h2>
            <p className="text-gray-600 max-w-xl">
              Expand your restaurant network by adding new locations to the Scan2Order system. 
              Each restaurant will have its own menu, tables, and QR codes.
            </p>
          </div>
          <Button 
            onClick={() => setShowRestaurantDialog(true)} 
            className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-medium py-6 px-8 text-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Restaurant
          </Button>
        </div>
      </div>
      
      {/* Restaurant Selection and Menu Item Management */}
      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select a Restaurant to Manage</label>
          <select
            className="w-full px-4 py-2 border border-orange-200 rounded-md bg-white"
            value={selectedRestaurantId || ''}
            onChange={(e) => setSelectedRestaurantId(Number(e.target.value))}
          >
            <option value="" disabled>Choose a restaurant</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>
        
        {selectedRestaurantId && (
          <div className="mt-4 sm:mt-0">
            <Button 
              onClick={() => setShowMenuItemDialog(true)} 
              className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Menu Item
            </Button>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="restaurants" className="w-full">
        <TabsList className="mb-8 bg-orange-50 p-1 border border-orange-100">
          <TabsTrigger value="restaurants" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Restaurants
          </TabsTrigger>
          <TabsTrigger value="menu" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Menu Items
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="restaurants" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <Card key={restaurant.id} className="p-6 border border-orange-100 shadow-sm">
                <h3 className="text-xl font-semibold text-orange-600 mb-2">{restaurant.name}</h3>
                <p className="text-gray-600 mb-1">{restaurant.address}</p>
                <p className="text-gray-600 mb-4">{restaurant.phone}</p>
                <Button 
                  onClick={() => setSelectedRestaurantId(restaurant.id)} 
                  variant="outline" 
                  className="border-orange-200 text-orange-600 w-full"
                >
                  View Menu Items
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="menu" className="space-y-6">
          {selectedRestaurantId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <Card key={item.id} className="p-6 border border-orange-100 shadow-sm">
                  {item.image && (
                    <div className="h-48 w-full bg-orange-50 rounded-md overflow-hidden mb-4">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Replace broken image with placeholder
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=No+Image';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-orange-600">{item.name}</h3>
                    <span className="font-bold text-orange-600">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{item.description}</p>
                  <p className="text-sm text-gray-500 mb-4">Category: {item.category}</p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Please select a restaurant to view menu items</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* New Restaurant Dialog */}
      <Dialog open={showRestaurantDialog} onOpenChange={setShowRestaurantDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-orange-600">Add New Restaurant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Restaurant Name *</Label>
              <Input
                id="name"
                value={newRestaurant.name}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                placeholder="Enter restaurant name"
                className="border-orange-100 focus:border-orange-300 focus:ring-orange-200"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">Address *</Label>
              <Input
                id="address"
                value={newRestaurant.address}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                placeholder="Enter restaurant address"
                className="border-orange-100 focus:border-orange-300 focus:ring-orange-200"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
              <Input
                id="phone"
                value={newRestaurant.phone}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, phone: e.target.value })}
                placeholder="Enter phone number (e.g. 555-123-4567)"
                className="border-orange-100 focus:border-orange-300 focus:ring-orange-200"
                required
              />
              <p className="text-xs text-gray-500 mt-1">All fields marked with * are required</p>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setShowRestaurantDialog(false)} className="border-orange-200">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRestaurant} 
              className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-medium"
            >
              Create Restaurant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Menu Item Dialog */}
      <Dialog open={showMenuItemDialog} onOpenChange={setShowMenuItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Item Name</Label>
              <Input
                id="item-name"
                value={newMenuItem.name}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                placeholder="Enter item name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newMenuItem.description}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                placeholder="Enter item description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={newMenuItem.price}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                placeholder="Enter price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newMenuItem.category}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                placeholder="Enter category (e.g., Appetizer, Main, Dessert)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL (optional)</Label>
              <Input
                id="image"
                value={newMenuItem.image}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, image: e.target.value })}
                placeholder="Enter image URL"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMenuItemDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateMenuItem} className="bg-orange-500 hover:bg-orange-600">
              Create Menu Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}