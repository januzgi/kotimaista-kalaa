import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fishermanProfile, setFishermanProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate('/');
        return;
      }

      try {
        // Check user role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError || userData?.role !== 'ADMIN') {
          toast({
            variant: "destructive",
            title: "Pääsy evätty",
            description: "Sinulla ei ole oikeuksia käyttää ylläpitoa.",
          });
          navigate('/');
          return;
        }

        // Check if user has fisherman profile
        const { data: profileData, error: profileError } = await supabase
          .from('fisherman_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching fisherman profile:', profileError);
        }

        setIsAdmin(true);
        setFishermanProfile(profileData);
      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, navigate, toast]);

  return {
    loading,
    isAdmin,
    fishermanProfile,
    user
  };
};