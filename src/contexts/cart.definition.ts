import { createContext } from "react";

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
export interface CartContextType {
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

export const CartContext = createContext<CartContextType | undefined>(
  undefined
);

/**
 * Local storage key for persisting cart data
 */
export const CART_STORAGE_KEY = "kotimaistakalaa_cart";
