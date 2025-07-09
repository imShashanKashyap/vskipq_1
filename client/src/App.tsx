import { Switch, Route, useLocation, Redirect } from "wouter";
import NotFound from "@/pages/not-found";
import MenuPage from "@/pages/MenuPage";
import QRGenerator from "@/pages/QRGenerator";
import ChefDashboard from "@/pages/ChefDashboard";
import ChefLogin from "@/pages/ChefLogin";
import ChefPerformancePage from "@/pages/ChefPerformancePage";
import MenuManagement from "@/pages/MenuManagement";
import RestaurantList from "@/pages/RestaurantList";
import CustomerLogin from "@/pages/CustomerLogin";
import CustomerOrders from "@/pages/CustomerOrders";
import OrderConfirmation from "@/pages/OrderConfirmation";
import TrackOrdersByPhone from "@/pages/TrackOrdersByPhone";
import PaymentPageOptimized from "@/pages/PaymentPageOptimized";
import AuthPage from "@/pages/auth-page";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminLanding from "@/pages/admin/index";
import AnalyticsDashboard from "@/pages/admin/AnalyticsDashboard";
import RestaurantManagement from "@/pages/admin/RestaurantManagement";
import { useEffect, useState, useCallback, memo } from "react";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { OrderProvider } from "@/context/OrderContext";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

// Constants
const VALID_RESTAURANT_IDS = [2, 3, 5, 6]; // Valid restaurant IDs in our system

// Helper functions
const isValidRestaurant = (id: number): boolean => {
  return !isNaN(id) && VALID_RESTAURANT_IDS.includes(id);
};

const saveTableFromUrl = (): void => {
  const url = new URL(window.location.href);
  const table = url.searchParams.get("table");
  
  if (table) {
    const tableNumber = parseInt(table, 10);
    if (!isNaN(tableNumber)) {
      localStorage.setItem("tableNumber", tableNumber.toString());
    }
  }
};

// Memoized Router component
const Router = memo(() => {
  const [location] = useLocation();
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  
  // Load and validate restaurant from localStorage
  useEffect(() => {
    const storedRestaurant = localStorage.getItem("selectedRestaurant");
    
    if (storedRestaurant) {
      try {
        const restaurantId = parseInt(storedRestaurant, 10);
        
        if (isValidRestaurant(restaurantId)) {
          setSelectedRestaurant(restaurantId);
        } else {
          localStorage.removeItem("selectedRestaurant");
          setSelectedRestaurant(null);
        }
      } catch (err) {
        localStorage.removeItem("selectedRestaurant");
      }
    }
    
    // Get table number from URL if present
    saveTableFromUrl();
  }, [location]);
  
  // Handler for restaurant route redirect
  const handleRestaurantRoute = useCallback((id: string) => {
    const restaurantId = parseInt(id, 10);
    
    if (isValidRestaurant(restaurantId)) {
      localStorage.setItem("selectedRestaurant", restaurantId.toString());
      return <Redirect to="/menu" />;
    }
    return <Redirect to="/" />;
  }, []);
  
  // Handler for restaurant menu route
  const handleRestaurantMenu = useCallback((id: string) => {
    const restaurantId = parseInt(id, 10);
    
    if (isValidRestaurant(restaurantId)) {
      localStorage.setItem("selectedRestaurant", restaurantId.toString());
      saveTableFromUrl();
      return <MenuPage restaurantId={restaurantId} initialView="menu" />;
    }
    return <Redirect to="/" />;
  }, []);
  
  return (
    <Switch>
      {/* Customer routes */}
      <Route path="/" component={RestaurantList} />
      <Route path="/restaurants">
        {() => <Redirect to="/" />}
      </Route>
      <Route path="/restaurant/:id">
        {(params) => handleRestaurantRoute(params.id)}
      </Route>
      <Route path="/restaurants/:id/menu">
        {(params) => handleRestaurantMenu(params.id)}
      </Route>
      <Route path="/menu">
        {() => {
          if (!selectedRestaurant) return <Redirect to="/" />;
          return <MenuPage restaurantId={selectedRestaurant} initialView="menu" />;
        }}
      </Route>
      <Route path="/customer/login" component={CustomerLogin} />
      <Route path="/customer/orders" component={CustomerOrders} />
      <Route path="/payment" component={PaymentPageOptimized} />
      <Route path="/payment/:orderId" component={PaymentPageOptimized} />
      <Route path="/order/confirmation/:orderId" component={OrderConfirmation} />
      <Route path="/tracking-order" component={TrackOrdersByPhone} />
      <Route path="/track-orders">
        {() => <Redirect to="/tracking-order" />}
      </Route>
      
      {/* Chef routes */}
      <Route path="/chef">
        {() => <ChefDashboard />}
      </Route>
      <Route path="/chef/login" component={ChefLogin} />
      <Route path="/chef/menu-management" component={MenuManagement} />
      <Route path="/chef/performance" component={ChefPerformancePage} />
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminLanding} />
      <Route path="/admin/dashboard" component={AnalyticsDashboard} />
      <Route path="/admin/qr-generator" component={QRGenerator} />
      <Route path="/admin/restaurants" component={RestaurantManagement} />
      
      {/* Auth routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Catch all route */}
      <Route component={NotFound} />
    </Switch>
  );
});

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <OrderProvider>
          <CartProvider>
            <Router />
          </CartProvider>
        </OrderProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
