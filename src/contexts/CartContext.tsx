import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  species: string;
  form: string;
  pricePerKg: number;
  quantity: number;
  fishermanName: string;
  availableQuantity: number;
}

interface CartContextType {
  items: CartItem[];
  removedItems: string[];
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  removeItemsById: (productIds: string[]) => void;
  clearRemovedItems: () => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'kotimaistakalaa_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
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

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

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

  const removeItemsById = (productIds: string[]) => {
    const removedItemNames: string[] = [];
    
    setItems(prevItems => {
      const itemsToRemove = prevItems.filter(item => productIds.includes(item.productId));
      removedItemNames.push(...itemsToRemove.map(item => `${item.species} (${item.form})`));
      
      return prevItems.filter(item => !productIds.includes(item.productId));
    });
    
    setRemovedItems(removedItemNames);
  };

  const clearRemovedItems = () => {
    setRemovedItems([]);
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemCount = () => {
    return items.length;
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.pricePerKg * item.quantity), 0);
  };

  const removeItem = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  const isInCart = (productId: string) => {
    return items.some(item => item.productId === productId);
  };

  return (
    <CartContext.Provider value={{
      items,
      removedItems,
      addItem,
      updateQuantity,
      removeItem,
      removeItemsById,
      clearRemovedItems,
      clearCart,
      getItemCount,
      getTotalPrice,
      isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};