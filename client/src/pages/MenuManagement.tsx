import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { MenuItem } from "@shared/schema";
import { Pencil, Trash2, Plus, X, Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MenuManagement() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  // Define a custom type for editing menu items that can have price as string or number
  interface EditingMenuItem extends Omit<MenuItem, 'price'> {
    price: number | string;
  }
  
  const [editingItem, setEditingItem] = useState<EditingMenuItem | null>(null);
  // Get restaurant ID from localStorage (set when navigating from chef dashboard)
  const storedRestaurantId = localStorage.getItem("chefRestaurantId");
  const initialRestaurantId = storedRestaurantId ? parseInt(storedRestaurantId, 10) : (user?.restaurantId || 1);
  
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    restaurantId: initialRestaurantId,
    active: true
  });

  // Validate user access
  useEffect(() => {
    // Try to load chef user from localStorage if AuthContext user is not available
    const storedChef = localStorage.getItem("chef");
    let chefUser = user;
    
    if (!chefUser && storedChef) {
      try {
        chefUser = JSON.parse(storedChef);
        console.log("MenuManagement - Loaded chef from localStorage:", chefUser);
      } catch (err) {
        console.error("MenuManagement - Failed to parse stored chef:", err);
      }
    }
    
    console.log("MenuManagement - Current user:", chefUser);
    
    if (!chefUser) {
      console.log("MenuManagement - No user found, redirecting to login");
      navigate("/chef/login");
    } else if (chefUser.role !== "chef" && chefUser.role !== "admin") {
      console.log("MenuManagement - User role not authorized:", chefUser.role);
      toast({
        title: "Access denied",
        description: "You need chef permissions to manage menu items",
        variant: "destructive"
      });
      navigate("/chef/login");
    } else {
      console.log("MenuManagement - User authenticated:", chefUser.username);
      // Set restaurantId for new menu items
      setNewItem(prev => ({
        ...prev,
        restaurantId: chefUser.restaurantId || initialRestaurantId
      }));
    }
  }, [user, navigate, toast, initialRestaurantId]);

  // Get menu items for this restaurant
  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu", initialRestaurantId],
    queryFn: async () => {
      const endpoint = initialRestaurantId 
        ? `/api/menu?restaurantId=${initialRestaurantId}` 
        : "/api/menu";
      const res = await fetch(endpoint);
      return res.json();
    },
    enabled: true // Always enabled, we'll handle auth check separately
  });

  // Create new menu item mutation
  const createMenuItem = useMutation({
    mutationFn: async (item: any) => {
      const response = await apiRequest("POST", "/api/menu", item);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu", initialRestaurantId] });
      setIsNewItemDialogOpen(false);
      setNewItem({
        name: "",
        description: "",
        price: "",
        category: "",
        image: "",
        restaurantId: initialRestaurantId,
        active: true
      });
      toast({
        title: "Menu item created",
        description: "The new menu item has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create menu item",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update menu item mutation
  const updateMenuItem = useMutation({
    mutationFn: async (item: any) => {
      const response = await apiRequest("PUT", `/api/menu/${item.id}`, item);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu", initialRestaurantId] });
      setIsEditItemDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "Menu item updated",
        description: "The menu item has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update menu item",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Toggle menu item active status mutation
  const toggleMenuItemStatus = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("PUT", `/api/menu/${id}/toggle-active`, {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu", initialRestaurantId] });
      toast({
        title: data.active ? "Menu item activated" : "Menu item deactivated",
        description: `${data.name} is now ${data.active ? "available" : "unavailable"} on the menu`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update menu item status",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle form input changes for new item
  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  // Handle form input changes for editing item
  const handleEditItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingItem) return;

    const { name, value } = e.target;
    setEditingItem(prev => prev ? { ...prev, [name]: value } : null);
  };

  // Handle new item submission
  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert price to number in cents
    const priceInCents = Math.round(parseFloat(newItem.price) * 100);
    
    if (isNaN(priceInCents)) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive"
      });
      return;
    }
    
    createMenuItem.mutate({
      ...newItem,
      price: priceInCents,
      restaurantId: initialRestaurantId
    });
  };

  // Handle edit item submission
  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    // If price is a string, convert it; otherwise use existing price
    let priceToSubmit = editingItem.price;
    if (typeof editingItem.price === 'string') {
      const priceInCents = Math.round(parseFloat(editingItem.price) * 100);
      if (isNaN(priceInCents)) {
        toast({
          title: "Invalid price",
          description: "Please enter a valid price",
          variant: "destructive"
        });
        return;
      }
      priceToSubmit = priceInCents;
    }
    
    updateMenuItem.mutate({
      ...editingItem,
      price: priceToSubmit
    });
  };

  // Start editing an item
  const handleEdit = (item: MenuItem) => {
    // Convert price from cents to dollars string for display
    const itemWithFormattedPrice: EditingMenuItem = {
      ...item,
      price: (item.price / 100).toFixed(2)
    };
    setEditingItem(itemWithFormattedPrice);
    setIsEditItemDialogOpen(true);
  };

  // Toggle item availability
  const handleToggleAvailability = (id: number) => {
    toggleMenuItemStatus.mutate(id);
  };

  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  // Get categories from menu items
  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-[#FF5722] rounded-full flex items-center justify-center">
              <i className="ri-restaurant-2-fill text-white text-xl"></i>
            </div>
            <div className="ml-2">
              <h1 className="font-['Poppins'] font-semibold text-lg">TableServe</h1>
              <p className="text-xs text-neutral-600">Menu Management</p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/chef")}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Orders
            </Button>
            
            <Button 
              onClick={() => logout().then(() => navigate("/chef/login"))}
              variant="outline"
              size="sm"
              className="text-[#FF5722]"
            >
              Exit
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-['Poppins'] font-semibold text-xl">Manage Menu Items</h2>
          
          <Button onClick={() => setIsNewItemDialogOpen(true)} className="bg-[#4CAF50] hover:bg-[#45a049]">
            <Plus className="h-4 w-4 mr-2" /> Add New Item
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <i className="ri-restaurant-line text-4xl text-neutral-300 mb-3"></i>
            <p className="text-neutral-600">No menu items available. Add your first item!</p>
          </div>
        ) : (
          <div>
            {/* Group by category */}
            {categories.map(category => (
              <div key={category} className="mb-8">
                <h3 className="font-medium text-lg mb-3 border-b pb-2">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.filter(item => item.category === category).map(item => (
                    <div 
                      key={item.id} 
                      className={`bg-white rounded-lg overflow-hidden shadow-sm transition-all ${!item.active ? 'opacity-60' : ''}`}
                    >
                      <div className="h-40 overflow-hidden relative">
                        <img 
                          src={item.image || 'https://via.placeholder.com/400x250?text=No+Image'} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="bg-white p-2 rounded-full shadow hover:bg-neutral-50"
                            title="Edit item"
                          >
                            <Pencil className="h-4 w-4 text-neutral-700" />
                          </button>
                          <button 
                            onClick={() => handleToggleAvailability(item.id)}
                            className={`p-2 rounded-full shadow ${item.active ? 'bg-[#E57373] hover:bg-[#EF5350]' : 'bg-[#81C784] hover:bg-[#66BB6A]'}`}
                            title={item.active ? "Mark as unavailable" : "Mark as available"}
                          >
                            {item.active ? (
                              <X className="h-4 w-4 text-white" />
                            ) : (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{item.name}</h4>
                          <span className="font-semibold text-[#FF5722]">{formatPrice(item.price)}</span>
                        </div>
                        <p className="text-sm text-neutral-600 line-clamp-2">{item.description}</p>
                        <div className="mt-2 pt-2 border-t border-dashed border-neutral-200 flex justify-between items-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${item.active ? 'bg-[#E8F5E9] text-[#4CAF50]' : 'bg-[#FFEBEE] text-[#F44336]'}`}>
                            {item.active ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* New Item Dialog */}
      <Dialog open={isNewItemDialogOpen} onOpenChange={setIsNewItemDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
            <DialogDescription>
              Fill in the details for the new menu item. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateItem}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Margherita Pizza"
                  value={newItem.name}
                  onChange={handleNewItemChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="e.g., Fresh mozzarella, tomato sauce, and basil on thin crust"
                  value={newItem.description}
                  onChange={handleNewItemChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="12.99"
                    step="0.01"
                    min="0"
                    value={newItem.price}
                    onChange={handleNewItemChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({...newItem, category: value})}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Default categories */}
                      <SelectItem value="Pizza">Pizza</SelectItem>
                      <SelectItem value="Pasta">Pasta</SelectItem>
                      <SelectItem value="Salad">Salad</SelectItem>
                      <SelectItem value="Dessert">Dessert</SelectItem>
                      <SelectItem value="Drinks">Drinks</SelectItem>
                      <SelectItem value="Main Course">Main Course</SelectItem>
                      <SelectItem value="Appetizer">Appetizer</SelectItem>
                      <SelectItem value="Bread">Bread</SelectItem>
                      <SelectItem value="Rice">Rice</SelectItem>
                      {/* Include existing categories */}
                      {categories.filter(cat => 
                        !["Pizza", "Pasta", "Salad", "Dessert", "Drinks", "Main Course", "Appetizer", "Bread", "Rice"].includes(cat)
                      ).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  name="image"
                  placeholder="e.g., https://images.unsplash.com/photo-123456789"
                  value={newItem.image}
                  onChange={handleNewItemChange}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={newItem.active}
                  onCheckedChange={(checked) => setNewItem({...newItem, active: checked})}
                />
                <Label htmlFor="active">Available on menu</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsNewItemDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-[#4CAF50] hover:bg-[#45a049]"
                disabled={createMenuItem.isPending}
              >
                {createMenuItem.isPending ? "Saving..." : "Save Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Item Dialog */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Make changes to the menu item. Click update when you're done.
            </DialogDescription>
          </DialogHeader>
          
          {editingItem && (
            <form onSubmit={handleUpdateItem}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Item Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    placeholder="e.g., Margherita Pizza"
                    value={editingItem.name}
                    onChange={handleEditItemChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    placeholder="e.g., Fresh mozzarella, tomato sauce, and basil on thin crust"
                    value={editingItem.description}
                    onChange={handleEditItemChange}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Price ($)</Label>
                    <Input
                      id="edit-price"
                      name="price"
                      type="number"
                      placeholder="12.99"
                      step="0.01"
                      min="0"
                      value={typeof editingItem.price === 'number' 
                        ? (editingItem.price / 100).toFixed(2) 
                        : editingItem.price}
                      onChange={handleEditItemChange}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select 
                      value={editingItem.category}
                      onValueChange={(value) => setEditingItem({...editingItem, category: value})}
                    >
                      <SelectTrigger id="edit-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Default categories */}
                        <SelectItem value="Pizza">Pizza</SelectItem>
                        <SelectItem value="Pasta">Pasta</SelectItem>
                        <SelectItem value="Salad">Salad</SelectItem>
                        <SelectItem value="Dessert">Dessert</SelectItem>
                        <SelectItem value="Drinks">Drinks</SelectItem>
                        <SelectItem value="Main Course">Main Course</SelectItem>
                        <SelectItem value="Appetizer">Appetizer</SelectItem>
                        <SelectItem value="Bread">Bread</SelectItem>
                        <SelectItem value="Rice">Rice</SelectItem>
                        {/* Include existing categories */}
                        {categories.filter(cat => 
                          !["Pizza", "Pasta", "Salad", "Dessert", "Drinks", "Main Course", "Appetizer", "Bread", "Rice"].includes(cat)
                        ).map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-image">Image URL</Label>
                  <Input
                    id="edit-image"
                    name="image"
                    placeholder="e.g., https://images.unsplash.com/photo-123456789"
                    value={editingItem.image}
                    onChange={handleEditItemChange}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-active"
                    checked={editingItem.active}
                    onCheckedChange={(checked) => setEditingItem({...editingItem, active: checked})}
                  />
                  <Label htmlFor="edit-active">Available on menu</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditItemDialogOpen(false);
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#2196F3] hover:bg-[#1976D2]"
                  disabled={updateMenuItem.isPending}
                >
                  {updateMenuItem.isPending ? "Updating..." : "Update Item"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}