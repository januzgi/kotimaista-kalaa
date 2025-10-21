import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Custom hook for handling user authentication with Supabase.
 *
 * Features:
 * - Manages authentication state (user, session, loading)
 * - OAuth provider sign-in (Google, Facebook, Apple)
 * - Email/password authentication
 * - User registration with email verification
 * - Automatic session persistence and token refresh
 * - Toast notifications for auth events
 *
 * The hook sets up real-time auth state listeners and automatically
 * manages the authentication lifecycle.
 *
 * @returns Object containing user state and authentication methods
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { toast } = useToast();

  /**
   * Sets up authentication state listeners and checks for existing sessions
   */
  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // This checks if the user has just successfully logged in via a redirect
      // from an external provider like Google.
      if (
        event === "SIGNED_IN" &&
        sessionStorage.getItem("oauth_in_progress") === "true"
      ) {
        toast({
          title: "Kirjauduit sisään onnistuneesti",
          description: "Tervetuloa takaisin!",
        });
        // Clean up the flag so it doesn't fire again on a normal page refresh
        sessionStorage.removeItem("oauth_in_progress");
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  /**
   * Signs in user with OAuth provider (Google, Facebook, Apple)
   * @param provider - The OAuth provider to use
   */
  const signInWithProvider = async (
    provider: "google" | "facebook" | "apple"
  ) => {
    try {
      sessionStorage.setItem("oauth_in_progress", "true");
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Kirjautuminen epäonnistui",
        description:
          error instanceof Error ? error.message : "Tuntematon virhe",
      });
    }
  };

  /**
   * Signs in user with email and password
   * @param email - User's email address
   * @param password - User's password
   */
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If Supabase returns an error, throw it so our catch block can handle it.
      if (error) throw error;

      // If there was no error, show the success message.
      toast({
        title: "Kirjauduit sisään onnistuneesti",
        description: "Tervetuloa takaisin!",
      });
    } catch (error) {
      // The catch block's only job is to handle the error by showing a message.
      // No need to throw again.
      toast({
        variant: "destructive",
        title: "Kirjautuminen epäonnistui",
        description: "Sähköposti tai salasana on virheellinen.",
      });
      console.error("Sign in error:", error); // It's good practice to log the actual error
    }
  };

  /**
   * Registers a new user with email and password
   * Note: Email verification is handled by the send-signup-confirmation Edge Function
   * which is triggered automatically on user signup via database trigger
   * @param email - User's email address
   * @param password - User's password
   */
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Rekisteröityminen epäonnistui",
        description:
          error instanceof Error ? error.message : "Tuntematon virhe",
      });
      throw error;
    }
  };

  /**
   * Signs out the current user
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Kirjauduit ulos onnistuneesti",
        description: "Nähdään pian!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uloskirjautuminen epäonnistui",
        description:
          error instanceof Error ? error.message : "Tuntematon virhe",
      });
    }
  };

  const openAuthDialog = () => setIsAuthDialogOpen(true);
  const closeAuthDialog = () => setIsAuthDialogOpen(false);

  return {
    user,
    session,
    loading,
    signInWithProvider,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isAuthDialogOpen,
    openAuthDialog,
    closeAuthDialog,
  };
};
