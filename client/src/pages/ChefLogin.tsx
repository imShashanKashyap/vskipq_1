import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Restaurant } from "@shared/schema";

export default function ChefLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "kitchen123" // Default password for easier testing
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | "">("");
  
  // Fetch available restaurants
  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ['/api/restaurants'],
  });

  // Handle user input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle restaurant selection change
  const handleRestaurantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const restaurantId = e.target.value ? parseInt(e.target.value) : "";
    setSelectedRestaurant(restaurantId);
    
    // Set username and password based on restaurant
    if (restaurantId === 3) {
      setCredentials({
        username: "italian_chef",
        password: "pizza123"
      });
    } else if (restaurantId === 2) {
      setCredentials({
        username: "indian_chef",
        password: "curry123"
      });
    } else if (restaurantId === 5) {
      setCredentials({
        username: "mexican_chef",
        password: "taco123"
      });
    } else if (restaurantId === 6) {
      setCredentials({
        username: "japanese_chef",
        password: "sushi123"
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password || !selectedRestaurant) {
      toast({
        title: "Error",
        description: "Please select a restaurant and enter your credentials",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`ChefLogin - Attempting login for ${credentials.username} at restaurant #${selectedRestaurant}`);
      
      // Use direct API call for more control over error handling
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });
      
      if (!response.ok) {
        throw new Error('Login failed: ' + (await response.text() || response.statusText));
      }
      
      const result = await response.json();
      
      if (result) {
        console.log("ChefLogin - Login successful:", result);
        
        // Store the selected restaurant and user data
        localStorage.setItem('selectedRestaurant', selectedRestaurant.toString());
        localStorage.setItem('chefUser', JSON.stringify(result));
        
        // Manually update auth context
        login(credentials.username, credentials.password).catch(e => console.error("Auth context update failed", e));
        
        toast({
          title: "Success",
          description: `Logged in as chef for ${restaurants.find(r => r.id === selectedRestaurant)?.name}`,
        });
        
        // Navigate to chef dashboard
        if (window.location.pathname.includes("menu-management")) {
          navigate("/chef/menu-management");
        } else {
          navigate("/chef");
        }
      }
    } catch (error) {
      console.error("ChefLogin - Login failed:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <section className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#FF5722] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-restaurant-2-fill text-white text-2xl"></i>
          </div>
          <h1 className="font-['Poppins'] font-semibold text-2xl">Chef Dashboard</h1>
          <p className="text-neutral-600">Login to manage orders</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Select Restaurant</label>
              <select
                name="restaurant"
                value={selectedRestaurant}
                onChange={handleRestaurantChange}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition"
              >
                <option value="">Select a restaurant</option>
                {restaurants.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Username</label>
              <input 
                type="text" 
                name="username"
                value={credentials.username}
                onChange={handleChange}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition"
                placeholder="Your chef username"
                readOnly={!!selectedRestaurant}
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Password</label>
              <input 
                type="password" 
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#FF5722] focus:border-[#FF5722] outline-none transition"
                placeholder="Enter password"
                readOnly={!!selectedRestaurant}
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading || !selectedRestaurant}
              className="w-full py-3 bg-[#FF5722] text-white font-medium rounded-lg transition duration-200 disabled:opacity-70">
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : "Login"}
            </button>
            <div className="text-center mt-3">
              <div className="text-gray-600 text-xs mb-2">
                Select a restaurant to automatically fill in chef credentials
              </div>
              <div className="flex justify-center space-x-4">
                <button 
                  type="button" 
                  onClick={() => navigate("/")} 
                  className="text-[#FF5722] text-sm">
                  Back to Customer View
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
