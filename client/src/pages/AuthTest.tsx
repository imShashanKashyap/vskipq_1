import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function AuthTest() {
  const { toast } = useToast();
  const { user, login, logout } = useAuth();
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Add a log message to the test results
  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Test login with a specific chef account
  const testLogin = async (username: string, password: string) => {
    setIsLoading(true);
    addLog(`Testing login for ${username} with password ${password}...`);
    
    try {
      const user = await login(username, password);
      if (user) {
        addLog(`✅ Login SUCCESSFUL for ${username}`);
        addLog(`User details: ${JSON.stringify(user)}`);
        
        toast({
          title: "Login Success",
          description: `Logged in as ${user.username} (${user.role})`,
        });
      } else {
        addLog(`❌ Login FAILED for ${username}`);
        
        toast({
          title: "Login Failed",
          description: "Authentication failed",
          variant: "destructive"
        });
      }
    } catch (error) {
      addLog(`❌ Error during login: ${error instanceof Error ? error.message : String(error)}`);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test all chef accounts
  const testAllChefs = async () => {
    setTestResults([]);
    addLog("=== Starting Chef Authentication Tests ===");
    
    // Test Italian chef
    await testLogin("italian_chef", "pizza123");
    await new Promise(r => setTimeout(r, 1000)); // Wait 1 second between tests
    
    // Test Indian chef
    await testLogin("indian_chef", "curry123");
    await new Promise(r => setTimeout(r, 1000));
    
    // Test Mexican chef
    await testLogin("mexican_chef", "taco123");
    await new Promise(r => setTimeout(r, 1000));
    
    // Test Japanese chef
    await testLogin("japanese_chef", "sushi123");
    
    addLog("=== Chef Authentication Tests Complete ===");
  };

  // Handle manual login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await login(loginData.username, loginData.password);
      if (user) {
        toast({
          title: "Login Success",
          description: `Logged in as ${user.username} (${user.role})`,
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Authentication failed",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
        
        {/* Current user status */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-2">Current User Status</h2>
          {user ? (
            <div>
              <p className="text-green-600 font-medium">✓ Logged in</p>
              <pre className="bg-gray-100 p-3 rounded mt-2 text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
              <button 
                onClick={() => logout()}
                className="mt-3 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <p className="text-red-600">✗ Not logged in</p>
          )}
        </div>
        
        {/* Login form */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Manual Login</h2>
          <form onSubmit={handleLogin} className="flex flex-col space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="mt-4 border-t pt-4">
            <h3 className="font-medium mb-2">Quick Login Buttons</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => testLogin("italian_chef", "pizza123")}
                disabled={isLoading}
                className="bg-red-500 text-white py-1 px-2 rounded text-sm hover:bg-red-600"
              >
                Italian Chef
              </button>
              <button 
                onClick={() => testLogin("indian_chef", "curry123")}
                disabled={isLoading}
                className="bg-yellow-500 text-white py-1 px-2 rounded text-sm hover:bg-yellow-600"
              >
                Indian Chef
              </button>
              <button 
                onClick={() => testLogin("mexican_chef", "taco123")}
                disabled={isLoading}
                className="bg-green-500 text-white py-1 px-2 rounded text-sm hover:bg-green-600"
              >
                Mexican Chef
              </button>
              <button 
                onClick={() => testLogin("japanese_chef", "sushi123")}
                disabled={isLoading}
                className="bg-blue-500 text-white py-1 px-2 rounded text-sm hover:bg-blue-600"
              >
                Japanese Chef
              </button>
            </div>
          </div>
        </div>
        
        {/* Automated testing */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Automated Testing</h2>
          <button
            onClick={testAllChefs}
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 mb-4"
          >
            Test All Chef Logins
          </button>
          
          {/* Test results */}
          {testResults.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Test Results</h3>
              <div className="bg-black text-green-400 font-mono p-3 rounded-md h-64 overflow-auto">
                {testResults.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}