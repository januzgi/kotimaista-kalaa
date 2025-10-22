import { useContext } from "react";
import { AuthContext } from "@/contexts/auth.definition";

// Custom hook to consume the AuthContext
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
