import { MenuItem, CartItem } from "@shared/schema";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  // Get cart context to check if item is already in cart
  const { cartItems, updateQuantity } = useCart();
  
  // Find if this item is already in the cart
  const cartItem = cartItems.find(cartItem => cartItem.menuItemId === item.id);
  const quantity = cartItem?.quantity || 0;
  const isInCart = quantity > 0;
  
  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };
  
  // Handle quantity decrease
  const handleDecrease = () => {
    if (cartItem) {
      updateQuantity(item.id, cartItem.quantity - 1);
    }
  };
  
  // Handle quantity increase
  const handleIncrease = () => {
    if (cartItem) {
      updateQuantity(item.id, cartItem.quantity + 1);
    } else {
      onAddToCart(item);
    }
  };
  
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition group">
      <div className="relative">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={item.image} 
            alt={item.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
        </div>
        <div className="absolute top-3 right-3 bg-white rounded-full py-1 px-3 shadow-lg">
          <span className="text-xs font-bold text-[#FF5722]">{item.category}</span>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-800 group-hover:text-[#FF5722] transition">
              {item.name}
            </h3>
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">{item.description}</p>
          </div>
          <span className="font-bold text-[#FF5722] text-lg ml-3">
            {formatPrice(item.price)}
          </span>
        </div>
        
        <div className="mt-5 flex">
          {isInCart ? (
            <div className="w-full flex items-center justify-between bg-gradient-to-r from-[#FF5722] to-[#FF7043] text-white rounded-lg shadow-md">
              <button 
                onClick={handleDecrease}
                className="p-2.5 flex-1 flex justify-center hover:bg-black/10 rounded-l-lg transition"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              
              <span className="font-medium text-sm py-2.5 px-3">
                {quantity}
              </span>
              
              <button 
                onClick={handleIncrease}
                className="p-2.5 flex-1 flex justify-center hover:bg-black/10 rounded-r-lg transition"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onAddToCart(item)} 
              className="w-full bg-gradient-to-r from-[#FF5722] to-[#FF7043] hover:from-[#E64A19] hover:to-[#FF5722] text-white py-2.5 px-4 rounded-lg font-medium text-sm transition flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
            >
              <Plus size={16} />
              <span>Add to Order</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
