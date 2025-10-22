import { useContext } from "react";
import { CartContext, CartContextType } from "@/contexts/cart.definition";

/**
 * Custom hook for accessing cart context and operations.
 *
 * Must be used within a CartProvider component. Provides access to all
 * cart operations including adding, removing, updating items, and
 * accessing cart state.
 *
 * @throws Error if used outside of CartProvider
 * @returns Cart context with all operations and state
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context as CartContextType;
};
