import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  role: string;
  restaurantId: number | null;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User | null>;
  register: (userData: RegisterUserData) => Promise<User | null>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

interface RegisterUserData {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  role: string;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Check if user is authenticated on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setIsLoading(true);
        // First try to get user from server session
        const response = await apiRequest("GET", "/api/user");
        
        if (response.ok) {
          const userData = await response.json();
          console.log("AuthContext - Loaded user from server session:", userData);
          setUser(userData);
          localStorage.setItem("auth_user", JSON.stringify(userData));
        } else {
          // If server session not available, try from localStorage
          const storedUser = localStorage.getItem("auth_user");
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              console.log("AuthContext - Loaded user from localStorage:", userData);
              setUser(userData);
            } catch (err) {
              console.error("AuthContext - Failed to parse stored user:", err);
              localStorage.removeItem("auth_user");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  // Login function
  const login = async (username: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("AuthContext - Attempting login:", { username });
      const response = await apiRequest("POST", "/api/login", { username, password });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to login");
      }
      
      const userData = await response.json();
      
      console.log("AuthContext - Login successful:", userData);
      
      // Save user to state and localStorage
      setUser(userData);
      localStorage.setItem("auth_user", JSON.stringify(userData));
      
      return userData;
    } catch (err) {
      console.error("AuthContext - Login failed:", err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register function
  const register = async (userData: RegisterUserData): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("AuthContext - Attempting registration:", { username: userData.username });
      const response = await apiRequest("POST", "/api/register", userData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to register");
      }
      
      const registeredUser = await response.json();
      
      console.log("AuthContext - Registration successful:", registeredUser);
      
      return registeredUser;
    } catch (err) {
      console.error("AuthContext - Registration failed:", err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    console.log("AuthContext - Logging out");
    
    try {
      // Call the server logout endpoint
      await apiRequest("POST", "/api/logout");
      
      // Clear local state
      setUser(null);
      localStorage.removeItem("auth_user");
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Even if server logout fails, clear local state
      setUser(null);
      localStorage.removeItem("auth_user");
      
      toast({
        title: "Logged out",
        description: "You have been logged out, but there was an issue with the server.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}