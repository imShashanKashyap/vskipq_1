import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

export default function CustomerLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login, register } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      try {
        return await login(credentials.username, credentials.password);
      } catch (error) {
        throw new Error('Login failed. Please check your credentials.');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Login Successful',
        description: 'Welcome back to Scan2Order!',
      });
      
      // Check if there's a stored restaurant, if yes go to menu, otherwise go to orders
      const storedRestaurant = localStorage.getItem("selectedRestaurant");
      if (storedRestaurant) {
        navigate('/menu');
      } else {
        // Direct user to their orders page where they can track all orders
        navigate('/customer/orders');
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: { 
      username: string; 
      password: string;
      email: string;
      phone: string;
    }) => {
      try {
        return await register({
          ...userData,
          role: 'customer', // Always register as customer from this page
        });
      } catch (error) {
        throw new Error('Registration failed. Please try again.');
      }
    },
    onSuccess: (user) => {
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created and you are now logged in.',
      });
      
      // Check if there's a stored restaurant
      const storedRestaurant = localStorage.getItem("selectedRestaurant");
      if (storedRestaurant) {
        navigate('/menu');
      } else {
        // Direct user to their orders page where they can track all orders
        navigate('/customer/orders');
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both username and password.',
        variant: 'destructive',
      });
      return;
    }
    
    loginMutation.mutate({ username, password });
  };
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !confirmPassword || !email) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    
    registerMutation.mutate({
      username,
      password,
      email,
      phone: phoneNumber,
    });
  };
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-[#FF5722] rounded-full flex items-center justify-center">
              <i className="ri-restaurant-2-fill text-white text-xl"></i>
            </div>
            <div className="ml-2">
              <h1 className="font-['Poppins'] font-semibold text-lg">Scan2Order</h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-[#FF5722] hover:underline flex items-center"
          >
            <i className="ri-arrow-left-line mr-1"></i>
            Back to Restaurants
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 pt-20 px-4 pb-10">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl">
          {/* Login/Register Form */}
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {isRegistering ? 'Create an Account' : 'Welcome Back'}
              </h2>
              <p className="text-neutral-600">
                {isRegistering 
                  ? 'Sign up to track your orders and streamline your dining experience.' 
                  : 'Sign in to access your order history and track your orders.'}
              </p>
            </div>
            
            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5722] focus:border-transparent"
                  required
                />
              </div>
              
              {isRegistering && (
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5722] focus:border-transparent"
                    required
                  />
                </div>
              )}
              
              {isRegistering && (
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Your phone number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5722] focus:border-transparent"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5722] focus:border-transparent"
                  required
                />
              </div>
              
              {isRegistering && (
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5722] focus:border-transparent"
                    required
                  />
                </div>
              )}
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loginMutation.isPending || registerMutation.isPending}
                  className="w-full bg-[#FF5722] text-white py-3 rounded-lg font-medium hover:bg-[#E64A19] transition-colors"
                >
                  {(loginMutation.isPending || registerMutation.isPending) ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : isRegistering ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-neutral-600">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="ml-1 text-[#FF5722] font-medium hover:underline"
                >
                  {isRegistering ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
          
          {/* Feature Highlights */}
          <div className="hidden md:block bg-gradient-to-br from-[#FF5722] to-[#FF8A65] p-8 rounded-xl text-white flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-6">Enhance Your Dining Experience</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <i className="ri-history-line text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Order History</h3>
                  <p className="text-white text-opacity-80">View your complete order history across all restaurants.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <i className="ri-notification-3-line text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Real-time Updates</h3>
                  <p className="text-white text-opacity-80">Receive notifications when your order status changes.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <i className="ri-repeat-line text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Quick Reorder</h3>
                  <p className="text-white text-opacity-80">Easily reorder your favorite meals with just a few clicks.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                  <i className="ri-user-settings-line text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Save Preferences</h3>
                  <p className="text-white text-opacity-80">Store your favorite restaurants and menu items.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}