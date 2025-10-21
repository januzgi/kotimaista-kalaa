import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuth } from "@/hooks/useAuth";

/**
 * Interface representing an item in the shopping cart
 */
export interface CartItem {
  /** Unique identifier for the product */
  productId: string;
  /** Fish species name */
  species: string;
  /** Fish preparation form (whole, filleted, etc.) */
  form: string;
  /** Price per kilogram */
  pricePerKg: number;
  /** Quantity in kilograms */
  quantity: number;
  /** Name of the fisherman selling the product */
  fishermanName: string;
  /** Available quantity in stock */
  availableQuantity: number;
}

/**
 * Context type defining all cart-related operations and state
 */
interface CartContextType {
  /** Array of items currently in the cart */
  items: CartItem[];
  /** Array of item names that were recently removed due to stock issues */
  removedItems: string[];
  /** Adds an item to the cart or increases quantity if already exists */
  addItem: (item: CartItem) => void;
  /** Updates the quantity of a specific item */
  updateQuantity: (productId: string, quantity: number) => void;
  /** Removes a specific item from the cart */
  removeItem: (productId: string) => void;
  /** Removes multiple items by their product IDs and tracks removed items */
  removeItemsById: (productIds: string[]) => void;
  /** Clears the list of recently removed items */
  clearRemovedItems: () => void;
  /** Removes all items from the cart */
  clearCart: () => void;
  /** Returns the total number of unique items in the cart */
  getItemCount: () => number;
  /** Calculates and returns the total price of all items */
  getTotalPrice: () => number;
  /** Checks if a specific product is already in the cart */
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Local storage key for persisting cart data
 */
const CART_STORAGE_KEY = 'kotimaistakalaa_cart';

/**
 * Cart context provider component that manages shopping cart state and persistence.
 * 
 * Features:
 * - Persistent cart storage using localStorage
 * - Add, update, and remove cart items
 * - Quantity management with validation
 * - Batch item removal for sold-out products
 * - Total price calculation
 * - Item count tracking
 * - Removed items tracking for user notifications
 * 
 * The cart automatically persists to localStorage and handles various
 * edge cases like sold-out items and quantity updates.
 * 
 * @param props - The provider props containing children components
 * @returns Cart context provider wrapping children
 */
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error parsing cart from localStorage:', error);
      return [];
    }
  });
  const [removedItems, setRemovedItems] = useState<string[]>([]);

  /**
   * Effect to persist cart to localStorage whenever items change
   */
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  /**
   * Adds an item to the cart or increases quantity if item already exists
   * @param item - The cart item to add
   */
  const addItem = (item: CartItem) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(i => i.productId === item.productId);
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + item.quantity
        };
        return newItems;
      } else {
        // Add new item
        return [...prevItems, item];
      }
    });
  };

  /**
   * Updates the quantity of a specific cart item
   * Removes the item if quantity is 0 or negative
   * @param productId - ID of the product to update
   * @param quantity - New quantity value
   */
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  /**
   * Removes multiple items from cart by their product IDs and tracks removed items
   * Used when products become unavailable/sold out
   * @param productIds - Array of product IDs to remove
   */
  const removeItemsById = (productIds: string[]) => {
    const removedItemNames: string[] = [];
    
    setItems(prevItems => {
      const itemsToRemove = prevItems.filter(item => productIds.includes(item.productId));
      removedItemNames.push(...itemsToRemove.map(item => `${item.species} (${item.form})`));
      
      return prevItems.filter(item => !productIds.includes(item.productId));
    });
    
    setRemovedItems(removedItemNames);
  };

  /**
   * Clears the list of recently removed items
   */
  const clearRemovedItems = () => {
    setRemovedItems([]);
  };

  /**
   * Removes all items from the cart and clears localStorage
   */
  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  /**
   * Returns the total number of unique items in the cart
   * @returns Number of unique items
   */
  const getItemCount = () => {
    return items.length;
  };

  /**
   * Calculates the total price of all items in the cart
   * @returns Total price in euros
   */
  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.pricePerKg * item.quantity), 0);
  };

  /**
   * Removes a single item from the cart by product ID
   * @param productId - ID of the product to remove
   */
  const removeItem = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  /**
   * Checks if a specific product is already in the cart
   * @param productId - ID of the product to check
   * @returns True if product is in cart
   */
  const isInCart = (productId: string) => {
    return items.some(item => item.productId === productId);
  };

  const value = useMemo(() => {
    if (!user) {
      // If user is logged out, provide an empty cart state
      return {
        items: [],
        removedItems: [],
        addItem: () => {},
        removeItem: () => {},
        updateQuantity: () => {},
        clearCart: () => {},
        getItemCount: () => 0,
        isInCart: () => false,
        clearRemovedItems: () => {},
        removeItemsById: () => {},
        getTotalPrice: () => 0,
      };
    }

    // If user is logged in, provide the real cart state
    return {
      items,
      removedItems,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemCount,
      isInCart,
      clearRemovedItems,
      removeItemsById,
      getTotalPrice,
    };
  }, [user, items, removedItems]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

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
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};