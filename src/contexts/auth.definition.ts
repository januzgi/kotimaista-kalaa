import { User, Session } from "@supabase/supabase-js";
import { createContext } from "react";

/**
 * Interface representing the authentication context type
 */
export interface AuthContextType {
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
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
