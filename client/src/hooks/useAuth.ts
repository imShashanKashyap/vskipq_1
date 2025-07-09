/**
 * Auth functionality has been moved to AuthContext
 * This file is kept for backwards compatibility
 * @deprecated Use useAuth from @/context/AuthContext instead
 */

import { useAuth as useNewAuth } from "@/context/AuthContext";

export { useAuth };

function useAuth() {
  return useNewAuth();
}