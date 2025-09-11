import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface NotificationContextType {
  newOrderCount: number;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider = ({
  children,
}: NotificationProviderProps) => {
  const [newOrderCount, setNewOrderCount] = useState(0);
  const { user } = useAuth();

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNewOrderCount(0);
      return;
    }

    try {
      // Check if user is admin
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userError || userData?.role !== "ADMIN") {
        setNewOrderCount(0);
        return;
      }

      // Get new order count using RPC function
      const { data, error } = await supabase.rpc("get_new_order_count");

      if (error) {
        console.error("Error fetching new order count:", error);
        return;
      }

      setNewOrderCount(data || 0);
    } catch (error) {
      console.error("Error in refreshNotifications:", error);
    }
  }, [user]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications, user]);

  // Set up real-time subscription for order changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("order_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          refreshNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshNotifications, user]);

  return (
    <NotificationContext.Provider
      value={{
        newOrderCount,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
