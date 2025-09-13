import { createContext, useContext } from "react";

// Define the shape of the context data
export interface NotificationContextType {
  newOrderCount: number;
  refreshNotifications: () => Promise<void>;
}

// Create the context that the provider and hook will share
export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

// Create and export the custom hook
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
