import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FishermanProfile } from "@/lib/types";

/**
 * Custom hook for managing admin access control and fisherman profile data.
 *
 * Features:
 * - Verifies user has ADMIN role in the database
 * - Fetches fisherman profile data
 * - Automatic redirection for unauthorized users
 * - Loading states for auth and data fetching
 * - Error handling with toast notifications
 *
 * This hook ensures that only authorized fishermen can access admin features
 * and provides the necessary profile data for admin operations.
 *
 * @returns Object containing loading state, admin status, profile data, and user info
 */
export const useAdminAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fishermanProfile, setFishermanProfile] =
    useState<FishermanProfile>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * Effect that checks admin access and fetches fisherman profile data
   * Redirects unauthorized users to homepage
   */
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return;

      if (!user) {
        navigate("/");
        return;
      }

      try {
        // Check user role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError || userData?.role !== "ADMIN") {
          toast({
            variant: "destructive",
            title: "Pääsy evätty",
            description: "Sinulla ei ole oikeuksia käyttää ylläpitoa.",
          });
          navigate("/");
          return;
        }

        // Check if user has fisherman profile
        const { data: profileData, error: profileError } = await supabase
          .from("fisherman_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching fisherman profile:", profileError);
        }

        setIsAdmin(true);
        setFishermanProfile(profileData);
      } catch (error) {
        console.error("Error checking admin access:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, navigate, toast]);

  return {
    /** Loading state for the access check */
    loading,
    /** Whether the user has admin privileges */
    isAdmin,
    /** Fisherman profile data (null if none exists) */
    fishermanProfile,
    /** Current authenticated user */
    user,
  };
};
