import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { MenuItem, CartItem, Restaurant } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface CustomerInfo {
  name: string;
  phone: string;
  notes: string;
}

interface CartContextType {
  cartItems: CartItem[];
  restaurant: Restaurant | null;
  customerInfo: CustomerInfo;
  calculateTotal: (items: CartItem[]) => number;
  addToCart: (menuItem: MenuItem) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  removeFromCart: (menuItemId: number) => void;
  clearCart: () => void;
  updateCustomerInfo: (info: CustomerInfo) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    notes: ''
  });
  const { toast } = useToast();

  // Load restaurant info from local storage
  useEffect(() => {
    const fetchRestaurant = async () => {
      const storedRestaurantId = localStorage.getItem("selectedRestaurant");
      if (storedRestaurantId) {
        try {
          const restaurantId = parseInt(storedRestaurantId, 10);
          const response = await fetch(`/api/restaurants/${restaurantId}`);
          if (response.ok) {
            const data = await response.json();
            setRestaurant(data);
          }
        } catch (error) {
          console.error("Error fetching restaurant:", error);
        }
      }
    };

    fetchRestaurant();
  }, []);
  
  // Add item to cart
  const addToCart = (menuItem: MenuItem) => {
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(item => item.menuItemId === menuItem.id);
      
      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          restaurantId: menuItem.restaurantId
        };
        return [...prevItems, newItem];
      }
    });
    
    toast({
      title: "Added to cart",
      description: `${menuItem.name} added to your order`,
    });
  };
  
  // Update item quantity
  const updateQuantity = (menuItemId: number, quantity: number) => {
    setCartItems(prevItems => {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        return prevItems.filter(item => item.menuItemId !== menuItemId);
      }
      
      // Update quantity
      return prevItems.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, quantity } 
          : item
      );
    });
  };
  
  // Remove item from cart
  const removeFromCart = (menuItemId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.menuItemId !== menuItemId));
  };
  
  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };
  
  // Update customer information
  const updateCustomerInfo = (info: CustomerInfo) => {
    setCustomerInfo(info);
  };
  
  // Calculate total price for items
  const calculateTotal = (items: CartItem[]): number => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  return (
    <CartContext.Provider value={{ 
      cartItems, 
      restaurant,
      customerInfo,
      calculateTotal,
      addToCart, 
      updateQuantity, 
      removeFromCart, 
      clearCart,
      updateCustomerInfo
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    console.warn("useCart must be used within a CartProvider");
    // Return a fallback empty implementation to prevent errors
    return {
      cartItems: [],
      restaurant: null,
      customerInfo: { name: '', phone: '', notes: '' },
      calculateTotal: () => 0,
      addToCart: () => {},
      updateQuantity: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
      updateCustomerInfo: () => {}
    };
  }
  return context;
}
