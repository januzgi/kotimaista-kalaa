import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Menu, LogOut, User, ShoppingCart, Fish, Settings } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthContext } from "@/contexts/AuthContext";

/**
 * A reusable navigation link component for both desktop and mobile views.
 */
const NavLink = ({
  to,
  Icon,
  label,
  badgeCount,
  isActive,
  isMobile = false,
  onClick,
}: {
  to: string;
  Icon: React.ElementType;
  label: string;
  badgeCount?: number;
  isActive: boolean;
  isMobile?: boolean;
  onClick?: () => void;
}) => {
  const desktopClasses = `flex items-center space-x-2 text-muted-foreground hover:text-foreground  transition-colors font-medium pb-1 border-b-2 relative ${
    isActive ? "border-secondary text-primary" : "border-transparent"
  }`;
  const mobileClasses = `flex items-center space-x-2 text-lg font-medium transition-colors relative ${
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground "
  }`;

  return (
    <Link
      to={to}
      className={isMobile ? mobileClasses : desktopClasses}
      onClick={onClick}
    >
      <Icon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
      <span>{label}</span>
      {badgeCount !== undefined && badgeCount > 0 && (
        <Badge
          variant="destructive"
          className="h-4 w-4 p-0 flex items-center justify-center text-xs"
        >
          {badgeCount}
        </Badge>
      )}
    </Link>
  );
};

/**
 * Application header component with navigation, authentication, and shopping cart.
 */
export const Header = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut, openAuthDialog } = useAuthContext();
  const { getItemCount } = useCart();
  const { newOrderCount } = useNotifications();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const cartItemCount = getItemCount();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        setIsAdmin(!error && data?.role === "ADMIN");
      } else {
        setIsAdmin(false);
      }
    };
    checkUserRole();
  }, [user]);

  const navItems = useMemo(
    () => [
      { to: "/saatavilla", label: "Saatavilla", Icon: Fish },
      {
        to: "/ostoskori",
        label: "Ostoskori",
        Icon: ShoppingCart,
        badgeCount: cartItemCount,
      },
      {
        to: "/admin",
        label: "Ylläpito",
        Icon: Settings,
        badgeCount: newOrderCount,
        adminOnly: true,
      },
    ],
    [cartItemCount, newOrderCount]
  );

  const getUserInitials = (name?: string) => {
    if (!name) return "K";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderNavLinks = (isMobile: boolean) =>
    navItems
      .filter((item) => !item.adminOnly || isAdmin)
      .map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          Icon={item.Icon}
          label={item.label}
          badgeCount={item.badgeCount}
          isActive={pathname === item.to}
          isMobile={isMobile}
          onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
        />
      ));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          to="/"
          className="text-xl font-bold text-primary hover:text-foreground /80 transition-colors"
        >
          Kotimaista kalaa
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          {renderNavLinks(false)}
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Desktop User Menu */}
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
                      <User className="mr-2 h-4 w-4" /> Profiili
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" /> Kirjaudu ulos
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu (Authenticated) */}
              <div className="md:hidden">
                <Sheet
                  open={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                >
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {" "}
                      <Menu className="h-5 w-5" />{" "}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <div className="flex flex-col space-y-4 mt-4">
                      {renderNavLinks(true)}
                      <Separator />
                      <Link
                        to="/profiili"
                        className="flex items-center space-x-2 text-sm font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
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
                        onClick={() => {
                          signOut();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full justify-start"
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Kirjaudu ulos
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            <>
              {/* Desktop Sign In */}
              <Button
                variant="outline"
                className="hidden md:inline-flex text-sm"
                onClick={openAuthDialog}
              >
                Kirjaudu sisään
              </Button>

              {/* Mobile Menu (Guest) */}
              <div className="md:hidden">
                <Sheet
                  open={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                >
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {" "}
                      <Menu className="h-5 w-5" />{" "}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <div className="flex flex-col space-y-4 mt-4">
                      {renderNavLinks(true)}
                      <Separator />
                      <Button onClick={openAuthDialog} variant="default">
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
    </header>
  );
};
