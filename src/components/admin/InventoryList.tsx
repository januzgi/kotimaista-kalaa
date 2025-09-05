import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Trash2, ShoppingBag, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  species: string;
  form: string;
  price_per_kg: number;
  available_quantity: number;
  catch_date: string;
  created_at: string;
}

interface FulfillmentSlot {
  id: string;
  start_time: string;
  end_time: string;
  type: 'PICKUP' | 'DELIVERY';
}

interface CatchGroup {
  catch_date: string;
  products: Product[];
  fulfillment_slots: FulfillmentSlot[];
}

interface InventoryListProps {
  fishermanProfileId: string;
  refreshKey: number;
}

export const InventoryList = ({ fishermanProfileId, refreshKey }: InventoryListProps) => {
  const [catchGroups, setCatchGroups] = useState<CatchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'product' | 'catch';
    id?: string;
    catchDate?: string;
    title: string;
    description: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        // Use the RPC function to get catch groups with proper data relationships
        const { data: catchGroupsData, error } = await supabase
          .rpc('get_catch_groups', { 
            fisherman_profile_id: fishermanProfileId 
          });

        if (error) throw error;

        // Transform the RPC result to match our interface
        const transformedGroups: CatchGroup[] = (catchGroupsData || []).map((group: any) => ({
          catch_date: group.catch_date,
          products: group.products || [],
          fulfillment_slots: group.fulfillment_slots || []
        }));

        setCatchGroups(transformedGroups);
      } catch (error) {
        console.error('Error fetching inventory data:', error);
        toast({
          variant: "destructive",
          title: "Virhe",
          description: "Varaston lataaminen epäonnistui.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, [fishermanProfileId, refreshKey, toast]);

  const formatCatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Saalis ${format(date, 'd. MMMM yyyy', { locale: fi })}`;
  };

  const formatTimeSlots = (slots: FulfillmentSlot[]) => {
    if (slots.length === 0) {
      return (
        <div className="text-muted-foreground">Ei aikatauluja</div>
      );
    }
    
    const pickupSlots = slots.filter(slot => slot.type === 'PICKUP');
    const deliverySlots = slots.filter(slot => slot.type === 'DELIVERY');
    
    const formatSlotTime = (slot: FulfillmentSlot) => {
      const date = format(new Date(slot.start_time), 'dd.MM.');
      const startTime = format(new Date(slot.start_time), 'HH:mm');
      const endTime = format(new Date(slot.end_time), 'HH:mm');
      return `${date} ${startTime} - ${endTime}`;
    };

    return (
      <div className="space-y-2">
        {pickupSlots.length > 0 && (
          <div className="flex items-start gap-2">
            <ShoppingBag className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <span className="font-medium">Noutoajat:</span>
              <div className="text-sm">
                {pickupSlots.map((slot, index) => (
                  <div key={slot.id}>
                    {formatSlotTime(slot)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {deliverySlots.length > 0 && (
          <div className="flex items-start gap-2">
            <Truck className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <span className="font-medium">Kuljetusajat:</span>
              <div className="text-sm">
                {deliverySlots.map((slot, index) => (
                  <div key={slot.id}>
                    {formatSlotTime(slot)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getTotalProducts = () => {
    return catchGroups.reduce((total, group) => total + group.products.length, 0);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteTarget({
      type: 'product',
      id: product.id,
      title: 'Poista tuote',
      description: 'Haluatko varmasti poistaa tämän tuotteen varastosta?'
    });
    setDeleteDialogOpen(true);
  };

  const handleDeleteCatch = (catchDate: string) => {
    setDeleteTarget({
      type: 'catch',
      catchDate,
      title: 'Poista saalis',
      description: 'Haluatko varmasti poistaa koko tämän päivän saaliin varastosta?'
    });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'product' && deleteTarget.id) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', deleteTarget.id);

        if (error) throw error;

        toast({
          title: "Tuote poistettu",
          description: "Tuote on poistettu varastosta.",
        });
      } else if (deleteTarget.type === 'catch' && deleteTarget.catchDate) {
        // Delete all products for this catch date
        const productsToDelete = catchGroups
          .find(group => group.catch_date === deleteTarget.catchDate)
          ?.products.map(p => p.id) || [];

        const { error: productsError } = await supabase
          .from('products')
          .delete()
          .in('id', productsToDelete);

        if (productsError) throw productsError;

        // Also delete fulfillment slots for this catch date
        const catchDate = new Date(deleteTarget.catchDate);
        const startOfDay = new Date(catchDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(catchDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { error: slotsError } = await supabase
          .from('fulfillment_slots')
          .delete()
          .eq('fisherman_id', fishermanProfileId)
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString());

        if (slotsError) throw slotsError;

        toast({
          title: "Saalis poistettu",
          description: "Koko päivän saalis on poistettu varastosta.",
        });
      }

      // Refresh the data by refetching using the same RPC function
      const fetchInventoryData = async () => {
        const { data: catchGroupsData, error } = await supabase
          .rpc('get_catch_groups', { 
            fisherman_profile_id: fishermanProfileId 
          });

        if (error) throw error;

        // Transform the RPC result to match our interface
        const transformedGroups: CatchGroup[] = (catchGroupsData || []).map((group: any) => ({
          catch_date: group.catch_date,
          products: group.products || [],
          fulfillment_slots: group.fulfillment_slots || []
        }));

        setCatchGroups(transformedGroups);
      };

      await fetchInventoryData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Poistaminen epäonnistui.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nykyinen varasto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nykyinen varasto ({getTotalProducts()})</CardTitle>
      </CardHeader>
      <CardContent>
        {catchGroups.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Ei tuotteita varastossa. Lisää ensimmäinen saalisi yllä olevalla lomakkeella.
          </p>
        ) : (
          <div className="space-y-8">
            {catchGroups.map((group) => (
              <div key={group.catch_date} className="space-y-4">
                {/* Catch Date Header */}
                <div className="border-b pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-primary">
                        {formatCatchDate(group.catch_date)}
                      </h2>
                      <div className="mt-2">
                        {formatTimeSlots(group.fulfillment_slots)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCatch(group.catch_date)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Products for this catch */}
                <div className="space-y-3 pl-4">
                  {group.products.map((product) => (
                    <div
                      key={product.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{product.species}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="secondary">{product.form}</Badge>
                            <Badge variant="outline">
                              {product.available_quantity} kg
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-lg text-primary">
                              {product.price_per_kg.toFixed(2)} €/kg
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTarget?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Peruuta</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Poista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};