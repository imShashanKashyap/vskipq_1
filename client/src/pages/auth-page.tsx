import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });

  // Handle redirects in useEffect to avoid breaking hook rules
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate("/admin");
      } else if (user.role === 'chef') {
        navigate("/chef");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Auth - Attempting login for ${credentials.username}`);
      
      const loggedInUser = await login(credentials.username, credentials.password);
      
      console.log("Auth - Login successful:", loggedInUser);
      
      if (loggedInUser) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${loggedInUser.username}!`,
        });
        
        // Redirect based on role
        if (loggedInUser.role === 'admin') {
          navigate("/admin");
        } else if (loggedInUser.role === 'chef') {
          navigate("/chef");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Auth - Login failed:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Registration",
      description: "Registration is handled by system administrators. Please contact support for a new account.",
    });
  };
  
  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-orange-600 to-amber-600 text-transparent bg-clip-text">
              Scan2Order
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username"
                      name="username"
                      placeholder="Enter your username"
                      value={credentials.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  
                  <div className="text-xs text-center text-muted-foreground mt-4">
                    <p>Admin Login: admin / admin123</p>
                    <p>Chef Login: Use the chef-specific login page</p>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Username</Label>
                    <Input 
                      id="reg-username"
                      placeholder="Enter desired username"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input 
                      id="reg-password"
                      type="password"
                      placeholder="Enter secure password"
                      disabled
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600"
                  >
                    Request Account
                  </Button>
                  
                  <div className="text-xs text-center text-muted-foreground mt-4">
                    <p>New accounts must be approved by system administrators</p>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right side - Hero section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-orange-500 to-amber-500 items-center justify-center p-12">
        <div className="max-w-lg text-white">
          <h1 className="text-4xl font-bold mb-6">
            Scan2Order Platform
          </h1>
          <p className="text-lg mb-8">
            The seamless restaurant ordering solution that eliminates waiting times and improves customer experience.
          </p>
          <ul className="space-y-4">
            <li className="flex items-center">
              <span className="bg-white text-amber-600 p-1 rounded-full mr-3">✓</span>
              QR code-based ordering system
            </li>
            <li className="flex items-center">
              <span className="bg-white text-amber-600 p-1 rounded-full mr-3">✓</span>
              Real-time order tracking
            </li>
            <li className="flex items-center">
              <span className="bg-white text-amber-600 p-1 rounded-full mr-3">✓</span>
              WhatsApp notifications
            </li>
            <li className="flex items-center">
              <span className="bg-white text-amber-600 p-1 rounded-full mr-3">✓</span>
              Multi-restaurant management
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}