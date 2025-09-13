import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { NotificationContext } from "@/hooks/useNotifications";

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
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userError || userData?.role !== "ADMIN") {
        setNewOrderCount(0);
        return;
      }

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
