import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "./AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const Header = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!error && data?.role === 'ADMIN') {
          setIsAdmin(true);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkUserRole();
  }, [user]);

  const getUserInitials = (name?: string) => {
    if (!name) return 'K';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <h1 
            className="text-xl font-bold text-primary cursor-pointer"
            onClick={() => navigate('/')}
          >
            Kotimaistakalaa
          </h1>
        </div>
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user.user_metadata?.avatar_url} 
                    alt={user.user_metadata?.full_name || 'Käyttäjä'} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getUserInitials(user.user_metadata?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem onClick={() => navigate('/profiili')}>
                Profiili
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  Ylläpito
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={signOut}>
                Kirjaudu ulos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            variant="outline" 
            className="text-sm"
            onClick={() => setShowAuthDialog(true)}
          >
            Kirjaudu sisään
          </Button>
        )}
      </div>
      
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
      />
    </header>
  );
};