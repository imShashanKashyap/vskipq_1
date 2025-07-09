import { useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AdminLanding() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if the user is authenticated and is an admin
    if (user && user.role === 'admin') {
      console.log("Admin dashboard accessed by:", user.username);
    }
  }, [user]);

  // Handle redirects in useEffect to avoid breaking hook rules
  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (!user) {
      navigate("/auth");
      return;
    }

    if (user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access the admin area.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout Failed",
        description: "There was an issue logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 text-transparent bg-clip-text">
          Admin Dashboard
        </h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Button 
          className="h-32 bg-gradient-to-br from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 border border-orange-200 text-orange-800"
          onClick={() => navigate("/admin/dashboard")}
        >
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-lg font-medium">Analytics Dashboard</span>
          </div>
        </Button>

        <Button 
          className="h-32 bg-gradient-to-br from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 border border-orange-200 text-orange-800"
          onClick={() => navigate("/admin/qr-generator")}
        >
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span className="text-lg font-medium">QR Code Generator</span>
          </div>
        </Button>

        <Button 
          className="h-32 bg-gradient-to-br from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 border border-orange-200 text-orange-800"
          onClick={() => navigate("/admin/restaurants")}
        >
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-lg font-medium">Restaurant Management</span>
          </div>
        </Button>
      </div>
    </div>
  );
}