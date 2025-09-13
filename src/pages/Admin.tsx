import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCatchForm } from "@/components/admin/AddCatchForm";
import { InventoryList } from "@/components/admin/InventoryList";
import { OrderManagement } from "@/components/admin/OrderManagement";
import { DefaultPricesManagement } from "@/components/admin/DefaultPricesManagement";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Fish, Euro, ShoppingCart, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FishermanSchedule } from "@/components/admin/FishermanSchedule";
import { useNotifications } from "@/hooks/useNotifications";

/**
 * Admin dashboard component for fishermen to manage their business.
 *
 * Features:
 * - Order management with new order notifications
 * - Catch inventory management (add, update, remove fish)
 * - Price management for different fish species
 * - Fishing schedule planning
 * - Admin access control and fisherman profile setup
 *
 * The component uses tabs to organize different admin functions:
 * - Tilaukset (Orders): View and manage customer orders
 * - Hallitse saalista (Manage Catch): Add new catch and manage inventory
 * - Kalastuspäivät (Fishing Days): Plan and manage fishing schedule
 * - Hallitse kilohintoja (Manage Prices): Set default prices for fish species
 *
 * Access is restricted to users with ADMIN role and requires a fisherman profile.
 *
 * @returns The admin dashboard component
 */
const Admin = () => {
  const { loading, isAdmin, fishermanProfile, user } = useAdminAccess();
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const { newOrderCount } = useNotifications();
  const navigate = useNavigate();

  /**
   * Creates a new fisherman profile for the current admin user
   */
  const handleCreateFishermanProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from("fisherman_profiles").insert({
        user_id: user.id,
        pickup_address: "Täytä myöhemmin",
        default_delivery_fee: 0,
      });

      if (error) throw error;

      toast({
        title: "Kalastajan profiili luotu",
        description: "Voit nyt lisätä saalista myyntiin.",
      });

      // Refresh the page to load the new profile
      window.location.reload();
    } catch (error) {
      console.error("Error creating fisherman profile:", error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Profiilin luominen epäonnistui.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ladataan ylläpitoa...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will be redirected by useAdminAccess hook
  }

  if (!fishermanProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Kalastajan profiili puuttuu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Sinulla täytyy olla kalastajan profiili voidaksesi hallita
                saalista ja tilauksia.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateFishermanProfile}
                  className="flex-1"
                >
                  Luo kalastajan profiili
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Takaisin etusivulle
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">
            Ylläpito
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Hallitse saalista ja tilauksia
          </p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <TabsList className="grid w-full grid-cols-3 flex-1">
              <TabsTrigger
                value="orders"
                className="text-xs sm:text-sm flex items-center gap-2 relative data-[state=active]:border-[#0e43f2] border-b-2 rounded-b-none data-[state=active]:shadow-md"
              >
                <ShoppingCart className="h-4 w-4" />
                Tilaukset
                {newOrderCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-4 w-4 p-0 flex items-center justify-center text-xs"
                  >
                    {newOrderCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="catch"
                className="text-xs sm:text-sm flex items-center gap-2 relative data-[state=active]:border-[#0e43f2] border-b-2 rounded-b-none data-[state=active]:shadow-md"
              >
                <Fish className="h-4 w-4" />
                Hallitse saalista
              </TabsTrigger>
              <TabsTrigger
                value="fishing-days"
                className="text-xs sm:text-sm flex items-center gap-2 relative data-[state=active]:border-[#0e43f2] border-b-2 rounded-b-none data-[state=active]:shadow-md"
              >
                <Calendar className="h-4 w-4" />
                Kalastuspäivät
              </TabsTrigger>
            </TabsList>

            <TabsList className="bg-transparent p-0">
              <TabsTrigger
                value="prices"
                className="text-xs sm:text-sm flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground data-[state=active]:border-[#0e43f2] border-b-2 rounded-b-none"
              >
                <Euro className="h-4 w-4" />
                Hallitse kilohintoja
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="catch" className="space-y-6">
            <AddCatchForm
              fishermanProfileId={fishermanProfile.id}
              onSuccess={() => setRefreshKey((prev) => prev + 1)}
            />
            <InventoryList
              fishermanProfileId={fishermanProfile.id}
              refreshKey={refreshKey}
            />
          </TabsContent>

          <TabsContent value="prices">
            <DefaultPricesManagement fishermanProfile={fishermanProfile} />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement fishermanProfile={fishermanProfile} />
          </TabsContent>

          <TabsContent value="fishing-days">
            <FishermanSchedule fishermanProfile={fishermanProfile} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
