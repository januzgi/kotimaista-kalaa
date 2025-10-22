import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session, User } from "@supabase/supabase-js";
import { AuthContext } from "./auth.definition";

// Create the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (
        event === "SIGNED_IN" &&
        sessionStorage.getItem("oauth_in_progress") === "true"
      ) {
        toast({
          title: "Kirjauduit sisään onnistuneesti",
          description: "Tervetuloa takaisin!",
        });
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

  // Wrap signInWithProvider in useCallback
  const signInWithProvider = useCallback(
    async (provider: "google") => {
      try {
        sessionStorage.setItem("oauth_in_progress", "true");
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: redirectUrl },
        });
        if (error) throw error;
      } catch (error) {
        sessionStorage.removeItem("oauth_in_progress"); // Clear flag on error too
        toast({
          variant: "destructive",
          title: "Kirjautuminen epäonnistui",
          description:
            error instanceof Error ? error.message : "Tuntematon virhe",
        });
      }
    },
    [toast]
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({
          title: "Kirjauduit sisään onnistuneesti",
          description: "Tervetuloa takaisin!",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Kirjautuminen epäonnistui",
          description: "Sähköposti tai salasana on virheellinen.",
        });
        console.error("Sign in error:", error);
      }
    },
    [toast]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
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
    },
    [toast]
  );

  const signOut = useCallback(async () => {
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
  }, [toast]);

  const openAuthDialog = () => setIsAuthDialogOpen(true);
  const closeAuthDialog = () => setIsAuthDialogOpen(false);

  // Memoize the context value
  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthDialogOpen,
      signInWithProvider,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      openAuthDialog,
      closeAuthDialog,
    }),
    [
      // Update dependencies to include the memoized functions
      user,
      session,
      loading,
      isAuthDialogOpen,
      signInWithProvider,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
