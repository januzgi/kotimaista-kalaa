import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import { Trash2, ShoppingBag, Truck, Edit, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CatchGroup, FulfillmentSlot, Product } from "@/lib/types";

/**
 * Props for the InventoryList component
 */
interface InventoryListProps {
  /** ID of the fisherman's profile */
  fishermanProfileId: string;
  /** Key that triggers data refresh when changed */
  refreshKey: number;
}

/**
 * Inventory management component for displaying and managing fish products.
 *
 * Features:
 * - Groups products by catch date for organized display
 * - Shows fulfillment slots (pickup/delivery times) for each catch
 * - Inline quantity editing with validation
 * - Individual product deletion
 * - Bulk catch deletion (removes all products and slots)
 * - Real-time inventory updates
 * - Confirmation dialogs for destructive actions
 * - Responsive layout with formatted time displays
 *
 * The component uses RPC functions to efficiently fetch related data
 * and provides a comprehensive interface for inventory management.
 *
 * @param props - The component props
 * @returns The inventory list component
 */
export const InventoryList = ({
  fishermanProfileId,
  refreshKey,
}: InventoryListProps) => {
  const [catchGroups, setCatchGroups] = useState<CatchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "product" | "catch";
    id?: string;
    catchDate?: string;
    title: string;
    description: string;
  } | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string>("");
  const { toast } = useToast();

  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_catch_groups", {
        fisherman_profile_id: fishermanProfileId,
      });

      if (error) throw error;

      // No transformation needed! The data is already in the correct shape.
      // We can directly cast it to our main CatchGroup type.
      const catchGroupsData = (data as unknown as CatchGroup[]) || [];
      setCatchGroups(catchGroupsData);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Varaston lataaminen epäonnistui.",
      });
    } finally {
      setLoading(false);
    }
  }, [fishermanProfileId, toast]);

  /**
   * Effect to fetch inventory data when component mounts or refresh key changes
   */
  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData, refreshKey]);

  /**
   * Formats catch date for display
   * @param dateString - ISO date string
   * @returns Formatted date string in Finnish
   */
  const formatCatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Saalis ${format(date, "d. MMMM yyyy", { locale: fi })}`;
  };

  /**
   * Formats fulfillment slots for display with pickup and delivery grouping
   * @param slots - Array of fulfillment slots
   * @returns JSX element displaying formatted time slots
   */
  const formatTimeSlots = (slots: FulfillmentSlot[]) => {
    if (slots.length === 0) {
      return <div className="text-muted-foreground">Ei aikatauluja</div>;
    }

    const pickupSlots = slots.filter((slot) => slot.type === "PICKUP");
    const deliverySlots = slots.filter((slot) => slot.type === "DELIVERY");

    const formatSlotTime = (slot: FulfillmentSlot) => {
      const date = format(new Date(slot.start_time), "dd.MM.");
      const startTime = format(new Date(slot.start_time), "HH:mm");
      const endTime = format(new Date(slot.end_time), "HH:mm");
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
                  <div key={`noutoaika-${slot.id}`}>{formatSlotTime(slot)}</div>
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
                  <div key={`kuljetusaika-${slot.id}`}>
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

  /**
   * Calculates total number of products across all catch groups
   * @returns Total product count
   */
  const getTotalProducts = () => {
    return catchGroups.reduce(
      (total, group) => total + group.products.length,
      0
    );
  };

  /**
   * Prepares delete confirmation dialog for a specific product
   * @param product - Product to be deleted
   */
  const handleDeleteProduct = (product: Product) => {
    setDeleteTarget({
      type: "product",
      id: product.id,
      title: "Poista tuote",
      description: "Haluatko varmasti poistaa tämän tuotteen varastosta?",
    });
    setDeleteDialogOpen(true);
  };

  /**
   * Prepares delete confirmation dialog for an entire catch
   * @param catchDate - Date of the catch to be deleted
   */
  const handleDeleteCatch = (catchDate: string) => {
    setDeleteTarget({
      type: "catch",
      catchDate,
      title: "Poista saalis",
      description:
        "Haluatko varmasti poistaa koko tämän päivän saaliin varastosta?",
    });
    setDeleteDialogOpen(true);
  };

  /**
   * Enables quantity editing mode for a product
   * @param product - Product to edit quantity for
   */
  const handleEditQuantity = (product: Product) => {
    setEditingProductId(product.id);
    setEditingQuantity(product.available_quantity.toString());
  };

  /**
   * Saves the edited quantity for a product
   * @param productId - ID of the product to update
   */
  const handleSaveQuantity = async (productId: string) => {
    const newQuantity = parseFloat(editingQuantity);

    if (isNaN(newQuantity) || newQuantity < 0) {
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Määrä täytyy olla vähintään 0.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .update({ available_quantity: newQuantity })
        .eq("id", productId);

      if (error) throw error;

      // Update the local state
      setCatchGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          products: group.products.map((product) =>
            product.id === productId
              ? { ...product, available_quantity: newQuantity }
              : product
          ),
        }))
      );

      setEditingProductId(null);
      setEditingQuantity("");

      toast({
        title: "Määrä päivitetty",
        description: "Tuotteen määrä on päivitetty.",
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Määrän päivittäminen epäonnistui.",
      });
    }
  };

  /**
   * Confirms and executes the deletion operation (product or catch)
   */
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === "product" && deleteTarget.id) {
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", deleteTarget.id);

        if (error) throw error;

        toast({
          title: "Tuote poistettu",
          description: "Tuote on poistettu varastosta.",
        });
      } else if (deleteTarget.type === "catch" && deleteTarget.catchDate) {
        // Delete the catch record - this will cascade delete all associated products and fulfillment slots
        const { error: catchError } = await supabase
          .from("catches")
          .delete()
          .eq("fisherman_id", fishermanProfileId)
          .eq("catch_date", deleteTarget.catchDate);

        if (catchError) throw catchError;

        toast({
          title: "Saalis poistettu",
          description: "Koko päivän saalis on poistettu varastosta.",
        });
      }

      // Refresh the data by refetching using the same RPC function
      await fetchInventoryData();
    } catch (error) {
      console.error("Error deleting:", error);
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
            Ei tuotteita varastossa. Lisää ensimmäinen saalisi yllä olevalla
            lomakkeella.
          </p>
        ) : (
          <div className="space-y-8">
            {catchGroups.map((group) => (
              <div key={group.catch_id} className="space-y-4">
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
                          <h3 className="font-semibold text-lg">
                            {product.species}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="secondary">{product.form}</Badge>
                            <div className="flex items-center gap-2">
                              {editingProductId === product.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={editingQuantity}
                                    onChange={(e) =>
                                      setEditingQuantity(e.target.value)
                                    }
                                    className="w-20 h-6 text-sm"
                                  />
                                  <span className="text-sm">kg</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleSaveQuantity(product.id)
                                    }
                                    className="flex gap-1 h-6 px-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <Check className="h-3 w-3" /> Tallenna
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {product.available_quantity} kg
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditQuantity(product)}
                                    className="h-6 gap-1 px-1 text-muted-foreground hover:text-accent-foreground"
                                  >
                                    <Edit className="h-3 w-3" /> Muokkaa
                                  </Button>
                                </div>
                              )}
                            </div>
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
