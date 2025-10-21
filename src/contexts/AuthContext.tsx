import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define the shape of the context value
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthDialogOpen: boolean;
  signInWithProvider: (provider: "google") => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  openAuthDialog: () => void;
  closeAuthDialog: () => void;
}

// Create the context with a default undefined value initially
const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const signInWithProvider = async (provider: "google") => {
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
      sessionStorage.removeItem("oauth_in_progress"); // Clear flag on error too
      toast({
        variant: "destructive",
        title: "Kirjautuminen epäonnistui",
        description:
          error instanceof Error ? error.message : "Tuntematon virhe",
      });
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
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
      // Re-throw the error if you want calling components to potentially handle it too
      // throw error;
    }
  };

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
      // Success is handled by AuthDialog showing the confirmation message
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Rekisteröityminen epäonnistui",
        description:
          error instanceof Error ? error.message : "Tuntematon virhe",
      });
      // Re-throw needed so AuthDialog doesn't show success on failure
      throw error;
    }
  };

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
  // --- End: Logic moved from useAuth.tsx ---

  // Memoize the context value to prevent unnecessary re-renders
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
      user,
      session,
      loading,
      isAuthDialogOpen,
      signInWithProvider,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    ]
  ); // Add dependencies

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to consume the AuthContext
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
