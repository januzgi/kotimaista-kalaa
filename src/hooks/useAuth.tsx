import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signInWithProvider = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      const redirectUrl = `${window.location.origin}/profiili`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl
        }
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
        description: error instanceof Error ? error.message : "Tuntematon virhe",
      });
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Kirjautuminen epäonnistui",
          description: "Sähköposti tai salasana on virheellinen",
        });
        throw error;
      }
      
      toast({
        title: "Kirjauduit sisään onnistuneesti",
        description: "Tervetuloa takaisin!",
      });
    } catch (error) {
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) throw error;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Rekisteröityminen epäonnistui",
        description: error instanceof Error ? error.message : "Tuntematon virhe",
      });
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
        description: error instanceof Error ? error.message : "Tuntematon virhe",
      });
    }
  };

  return {
    user,
    session,
    loading,
    signInWithProvider,
    signInWithEmail,
    signUpWithEmail,
    signOut
  };
};