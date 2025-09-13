import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "./AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Menu, LogOut, User, ShoppingCart, Fish, Settings } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";

/**
 * Application header component with navigation, authentication, and shopping cart.
 *
 * Features:
 * - Responsive navigation (desktop and mobile)
 * - User authentication status display
 * - Shopping cart with item count badge
 * - Admin access for fishermen
 * - Notification badges for new orders (admin only)
 * - User profile dropdown menu
 *
 * The header adapts its content based on:
 * - User authentication status
 * - User role (admin/customer)
 * - Current route highlighting
 * - Shopping cart item count
 * - Pending order notifications
 *
 * @returns The header component with navigation and user controls
 */
export const Header = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const { getItemCount } = useCart();
  const { newOrderCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const cartItemCount = getItemCount();

  const isActivePage = (path: string) => location.pathname === path;

  /**
   * Checks if the current user has admin role by querying the database
   */
  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!error && data?.role === "ADMIN") {
          setIsAdmin(true);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkUserRole();
  }, [user]);

  /**
   * Generates user initials from full name for avatar fallback
   * @param name - User's full name
   * @returns Initials string (max 2 characters)
   */
  const getUserInitials = (name?: string) => {
    if (!name) return "K";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link
            to="/"
            className="text-xl font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Kotimaista kalaa
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <Link
            to="/saatavilla"
            className={`flex items-center space-x-2 text-muted-foreground hover:text-dark transition-colors font-medium pb-1 border-b-2 ${
              isActivePage("/saatavilla")
                ? "border-[#0e43f2] text-dark"
                : "border-transparent"
            }`}
          >
            <Fish className="h-4 w-4" />
            <span>Saatavilla</span>
          </Link>
          <Link
            to="/ostoskori"
            className={`flex items-center space-x-2 text-muted-foreground hover:text-dark transition-colors font-medium pb-1 border-b-2 relative ${
              isActivePage("/ostoskori")
                ? "border-[#0e43f2] text-dark"
                : "border-transparent"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Ostoskori</span>
            {cartItemCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {cartItemCount}
              </Badge>
            )}
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center space-x-2 text-muted-foreground hover:text-dark transition-colors font-medium pb-1 border-b-2 relative ${
                isActivePage("/admin")
                  ? "border-[#0e43f2] text-dark"
                  : "border-transparent"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Ylläpito</span>
              {newOrderCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {newOrderCount}
                </Badge>
              )}
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Desktop user menu */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url}
                          alt={user.user_metadata?.full_name || "Käyttäjä"}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getUserInitials(user.user_metadata?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem onClick={() => navigate("/profiili")}>
                      <User className="mr-2 h-4 w-4" />
                      Profiili
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Kirjaudu ulos
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile menu */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <div className="flex flex-col space-y-4 mt-4">
                      <Link
                        to="/saatavilla"
                        className={`flex items-center space-x-2 text-lg font-medium transition-colors ${
                          isActivePage("/saatavilla")
                            ? "text-[#0e43f2]"
                            : "text-muted-foreground hover:text-dark"
                        }`}
                      >
                        <Fish className="h-5 w-5" />
                        <span>Saatavilla</span>
                      </Link>
                      <Link
                        to="/ostoskori"
                        className={`flex items-center space-x-2 text-lg font-medium transition-colors ${
                          isActivePage("/ostoskori")
                            ? "text-[#0e43f2]"
                            : "text-muted-foreground hover:text-dark"
                        }`}
                      >
                        <ShoppingCart className="h-5 w-5" />
                        <span>Ostoskori</span>
                        {cartItemCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {cartItemCount}
                          </Badge>
                        )}
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className={`flex items-center space-x-2 text-lg font-medium transition-colors ${
                            isActivePage("/admin")
                              ? "text-[#0e43f2]"
                              : "text-muted-foreground hover:text-dark"
                          }`}
                        >
                          <Settings className="h-5 w-5" />
                          <span>Ylläpito</span>
                          {newOrderCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {newOrderCount}
                            </Badge>
                          )}
                        </Link>
                      )}
                      <Separator />
                      <Link
                        to="/profiili"
                        className="flex items-center space-x-2 text-sm font-medium"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback>
                            {getUserInitials(user.user_metadata?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {user.user_metadata?.full_name || user.email}
                        </span>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={signOut}
                        className="w-full justify-start"
                      >
                        <LogOut className="h-4 w-4" />
                        Kirjaudu ulos
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            <>
              {/* Desktop sign in */}
              <Button
                variant="outline"
                className="hidden md:inline-flex text-sm"
                onClick={() => setShowAuthDialog(true)}
              >
                Kirjaudu sisään
              </Button>

              {/* Mobile menu for non-authenticated users */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <div className="flex flex-col space-y-4 mt-4">
                      <Link
                        to="/saatavilla"
                        className={`flex items-center space-x-2 text-lg font-medium transition-colors ${
                          isActivePage("/saatavilla")
                            ? "text-[#0e43f2]"
                            : "text-muted-foreground hover:text-dark"
                        }`}
                      >
                        <Fish className="h-5 w-5" />
                        <span>Saatavilla</span>
                      </Link>
                      <Link
                        to="/ostoskori"
                        className={`flex items-center space-x-2 text-lg font-medium transition-colors ${
                          isActivePage("/ostoskori")
                            ? "text-[#0e43f2]"
                            : "text-muted-foreground hover:text-dark"
                        }`}
                      >
                        <ShoppingCart className="h-5 w-5" />
                        <span>Ostoskori</span>
                        {cartItemCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {cartItemCount}
                          </Badge>
                        )}
                      </Link>
                      <Separator />
                      <Button
                        onClick={() => setShowAuthDialog(true)}
                        variant="default"
                      >
                        Kirjaudu sisään
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          )}
        </div>
      </div>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </header>
  );
};
