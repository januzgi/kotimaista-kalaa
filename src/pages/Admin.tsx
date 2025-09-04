import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddCatchForm } from '@/components/admin/AddCatchForm';
import { InventoryList } from '@/components/admin/InventoryList';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { DefaultPricesManagement } from '@/components/admin/DefaultPricesManagement';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const { loading, isAdmin, fishermanProfile, user } = useAdminAccess();
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCreateFishermanProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('fisherman_profiles')
        .insert({
          user_id: user.id,
          pickup_address: 'Täytä myöhemmin',
          default_delivery_fee: 0
        });

      if (error) throw error;

      toast({
        title: "Kalastajan profiili luotu",
        description: "Voit nyt lisätä saalista myyntiin.",
      });

      // Refresh the page to load the new profile
      window.location.reload();
    } catch (error) {
      console.error('Error creating fisherman profile:', error);
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
                Sinulla täytyy olla kalastajan profiili voidaksesi hallita saalista ja tilauksia.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleCreateFishermanProfile} className="flex-1">
                  Luo kalastajan profiili
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">Ylläpito</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Hallitse saalista ja tilauksia
          </p>
        </div>

        <Tabs defaultValue="catch" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="catch" className="text-xs sm:text-sm">Hallitse saalista</TabsTrigger>
            <TabsTrigger value="prices" className="text-xs sm:text-sm">Hallitse kilohintoja</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm">Tilaukset</TabsTrigger>
          </TabsList>

          <TabsContent value="catch" className="space-y-6">
            <AddCatchForm
              fishermanProfileId={fishermanProfile.id}
              onSuccess={() => setRefreshKey(prev => prev + 1)}
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
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;