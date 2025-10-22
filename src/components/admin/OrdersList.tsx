import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Phone,
  User,
  XCircle,
  Truck,
  ShoppingBag,
  PackageCheck,
  CheckCircle2,
} from "lucide-react";
import { Order, FishermanProfile } from "@/lib/types";
import { ConfirmationDialog } from "../ConfirmationDialog";
import { FishIcon } from "../FishIcon";
import { useNotifications } from "@/hooks/useNotifications";

/**
 * Props for the OrdersList component
 */
interface OrdersListProps {
  fishermanProfile: FishermanProfile | null;
  status: "NEW" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  refreshTrigger?: number;
}

/**
 * Component for displaying and managing orders for a specific fisherman.
 *
 * Features:
 * - Lists orders filtered by status (NEW, CONFIRMED, COMPLETED, CANCELLED)
 * - Expandable order details with customer and fulfillment information
 * - Order confirmation with customizable delivery fees
 * - Order cancellation with automatic inventory restoration
 * - Real-time updates via notification system
 * - Email notifications for order confirmations
 * - Responsive design with status badges and icons
 * - Order total calculations including delivery fees
 *
 * The component handles the complete order management workflow from
 * initial order review to final confirmation or cancellation.
 *
 * @param props - The component props
 * @returns The orders list component with management capabilities
 */
export const OrdersList = ({
  fishermanProfile,
  status,
  refreshTrigger,
}: OrdersListProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [processingState, setProcessingState] = useState<{
    [key: string]: boolean;
  }>({});
  const { toast } = useToast();
  const { refreshNotifications } = useNotifications();

  /**
   * Fetches orders for the fisherman filtered by status
   */
  const fetchOrders = useCallback(async () => {
    if (!fishermanProfile?.id) {
      setLoading(false);
      setOrders([]);
      return;
    }

    try {
      setLoading(true);

      // Fetch orders directly using fisherman_profile_id
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          customer_name,
          customer_address,
          customer_phone,
          fulfillment_type,
          final_delivery_fee,
          status,
          created_at,
          fulfillment_slot:fulfillment_slots(
            start_time,
            end_time,
            type
          ),
          order_items(
            id,
            quantity,
            product:products(
              species,
              form,
              price_per_kg
            )
          )
        `
        )
        .eq("status", status)
        .eq("fisherman_profile_id", fishermanProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Tilausten lataaminen epäonnistui.",
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fishermanProfile, status, toast, refreshTrigger]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /**
   * Marks an order as completed and shows it in the COMPLETED tab for fisherman
   * @param orderId - ID of the order to complete
   */
  const handleMarkCompleted = async (orderId: string) => {
    setProcessingState((prev) => ({ ...prev, [orderId]: true }));
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "COMPLETED" })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Tilaus merkitty valmiiksi",
        description: "Tilaus on nyt siirretty Valmiit-välilehdelle.",
      });

      fetchOrders(); // Refetch orders to update the UI
      setExpandedOrder(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Tilauksen merkitseminen valmiiksi epäonnistui.",
      });
    } finally {
      setProcessingState((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  /**
   * Confirms an order and sends confirmation email to customer
   * @param orderId - ID of the order to confirm
   */
  const handleConfirmOrder = async (orderId: string) => {
    setProcessingState((prev) => ({ ...prev, [orderId]: true }));
    try {
      // Update order status to CONFIRMED
      const { error } = await supabase
        .from("orders")
        .update({
          status: "CONFIRMED",
          final_delivery_fee: deliveryFee,
        })
        .eq("id", orderId);

      if (error) throw error;

      // Send confirmation email to customer
      try {
        const { data, error: functionError } = await supabase.functions.invoke(
          "send-order-confirmation",
          {
            body: { orderId },
          }
        );

        if (functionError) {
          toast({
            variant: "destructive",
            title: "Varoitus",
            description:
              "Tilaus vahvistettiin, mutta vahvistussähköpostin lähetys epäonnistui. Voit laittaa kalastajalle viestin niin hän varmasti huomaa tilauksesi.",
          });
        }
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        toast({
          variant: "destructive",
          title: "Virhe",
          description:
            "Vahvistussähköpostin lähetys epäonnistui. Voit laittaa kalastajalle viestin niin hän varmasti huomaa tilauksesi.",
        });
      }

      toast({
        title: "Tilaus vahvistettu",
        description:
          "Tilaus on vahvistettu ja asiakas on saanut vahvistussähköpostin.",
      });

      fetchOrders();
      refreshNotifications();
      setExpandedOrder(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Tilauksen vahvistaminen epäonnistui.",
      });
    } finally {
      setProcessingState((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  /**
   * Cancels an order and restores inventory for all order items
   * @param order - The order to cancel
   */
  const handleCancelOrder = async (order: Order) => {
    setProcessingState((prev) => ({ ...prev, [order.id]: true }));
    try {
      // Start by updating the order status to CANCELLED
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "CANCELLED" })
        .eq("id", order.id);

      if (orderError) throw orderError;

      // Restore inventory for each order item
      for (const item of order.order_items) {
        // Get the product ID from the order_items table
        const { data: orderItemData, error: orderItemError } = await supabase
          .from("order_items")
          .select("product_id")
          .eq("id", item.id)
          .single();

        if (orderItemError) throw orderItemError;

        // Get current product quantity and restore the ordered amount
        const { data: currentProduct, error: fetchError } = await supabase
          .from("products")
          .select("available_quantity")
          .eq("id", orderItemData.product_id)
          .single();

        if (fetchError) throw fetchError;

        // Update the product quantity by adding back the cancelled amount
        const { error: updateError } = await supabase
          .from("products")
          .update({
            available_quantity:
              currentProduct.available_quantity + item.quantity,
          })
          .eq("id", orderItemData.product_id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Tilaus peruttu",
        description: "Tilaus on peruttu ja tuotteet palautettu varastoon.",
      });

      fetchOrders();
      refreshNotifications();
      setExpandedOrder(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Tilauksen peruuttaminen epäonnistui.",
      });
    } finally {
      setProcessingState((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  /**
   * Toggles the expansion state of an order card
   * @param orderId - ID of the order to toggle
   */
  const toggleOrderExpansion = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      const order = orders.find((o) => o.id === orderId);
      // Use the default fee from the fishermanProfile prop now
      if (order && order.fulfillment_type === "DELIVERY" && fishermanProfile) {
        setDeliveryFee(
          order.final_delivery_fee || fishermanProfile.default_delivery_fee || 0
        );
      }
    }
  };

  /**
   * Calculates the total price for an order including delivery fees
   * @param order - The order to calculate total for
   * @returns Total price in euros
   */
  const calculateOrderTotal = (order: Order) => {
    const itemsTotal = order.order_items.reduce((sum, item) => {
      return sum + item.quantity * item.product.price_per_kg;
    }, 0);

    const fee =
      order.fulfillment_type === "DELIVERY" ? order.final_delivery_fee || 0 : 0;
    return itemsTotal + fee;
  };

  /**
   * Returns the appropriate badge variant for order status
   * @param orderStatus - The status of the order
   * @returns Badge variant string
   */
  const getStatusBadgeVariant = (orderStatus: string) => {
    switch (orderStatus) {
      case "NEW":
        return "destructive";
      case "CONFIRMED":
        return "default";
      case "COMPLETED":
        return "default";
      case "CANCELLED":
        return "outline";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Ladataan tilauksia...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {status === "NEW" && "Ei uusia tilauksia."}
          {status === "CONFIRMED" && "Ei vahvistettuja tilauksia."}
          {status === "COMPLETED" && "Ei valmiita tilauksia."}
          {status === "CANCELLED" && "Ei peruttuja tilauksia."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card
          key={order.id}
          className="transition-all duration-200 max-w-[600px] mx-auto"
        >
          <CardHeader
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => toggleOrderExpansion(order.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-start md:items-center">
                <div>
                  <CardTitle className="text-lg italic">
                    {order.customer_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), "dd.MM.yyyy HH:mm", {
                      locale: fi,
                    })}
                  </p>
                </div>
                <Badge
                  variant={
                    order.fulfillment_type === "PICKUP"
                      ? "outline"
                      : "secondary"
                  }
                >
                  {order.fulfillment_type === "PICKUP" ? (
                    <>
                      <ShoppingBag className="mr-1 h-4 w-4" /> Nouto
                    </>
                  ) : (
                    <>
                      <Truck className="mr-1 h-4 w-4" /> Kotiinkuljetus
                    </>
                  )}
                </Badge>
                <Badge variant={getStatusBadgeVariant(order.status)}>
                  {order.status === "NEW" && "Uusi"}
                  {order.status === "CONFIRMED" && (
                    <>
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Vahvistettu
                    </>
                  )}
                  {order.status === "COMPLETED" && (
                    <>
                      <PackageCheck className="mr-1 h-4 w-4" /> Valmis
                    </>
                  )}
                  {order.status === "CANCELLED" && (
                    <span className="flex items-center text-destructive">
                      <XCircle className="mr-1 h-4 w-4" /> Peruttu
                    </span>
                  )}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">
                  {calculateOrderTotal(order).toFixed(2)} €
                </span>
                {expandedOrder === order.id ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>
          </CardHeader>

          {expandedOrder === order.id && (
            <CardContent className="pt-0">
              <Separator className="mb-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center">
                    <User className="mr-2 h-4 w-4 text-primary" />
                    Asiakkaan tiedot
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Nimi:</strong> {order.customer_name}
                    </p>
                    <p className="flex items-start">
                      <Phone className="mr-2 h-4 w-4 mt-0.5" />
                      {order.customer_phone}
                    </p>
                    {order.customer_address && (
                      <p className="flex items-start">
                        <MapPin className="mr-2 h-4 w-4 mt-0.5" />
                        {order.customer_address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Fulfillment Information */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-primary" />
                    Toimitustiedot
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center">
                      <strong className="mr-2">Tyyppi:</strong>
                      {order.fulfillment_type === "PICKUP" ? (
                        <span className="flex items-center">
                          <ShoppingBag className="mr-1 h-4 w-4" />
                          Nouto
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Truck className="mr-1 h-4 w-4" />
                          Kotiinkuljetus
                        </span>
                      )}
                    </p>
                    {order.fulfillment_slot ? (
                      <p>
                        <strong>Aika:</strong>{" "}
                        {format(
                          new Date(order.fulfillment_slot.start_time),
                          "dd.MM.yyyy HH:mm",
                          { locale: fi }
                        )}{" "}
                        -{" "}
                        {format(
                          new Date(order.fulfillment_slot.end_time),
                          "HH:mm",
                          { locale: fi }
                        )}
                      </p>
                    ) : (
                      <p>
                        <strong>Aika:</strong> Sovittava erikseen
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-6">
                <h4 className="font-semibold text-primary">Tilatut tuotteet</h4>
                <div className="space-y-2">
                  {order.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between py-2 border-b"
                    >
                      <div className="flex items-center flex-wrap xs:flex-nowrap max-w-[150px] xs:max-w-unset">
                        <FishIcon species={item.product.species} />
                        <span className="font-medium">
                          {item.product.species}
                        </span>
                        <span className="text-muted-foreground mx-2 w-full xs:w-auto">
                          {item.product.form}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs xs:text-sm grow text-muted-foreground">
                          {item.quantity} kg ×{" "}
                          {item.product.price_per_kg.toFixed(2)} €/kg
                        </div>
                        <div className="font-semibold">
                          {(item.quantity * item.product.price_per_kg).toFixed(
                            2
                          )}{" "}
                          €
                        </div>
                      </div>
                    </div>
                  ))}

                  {order.fulfillment_type === "DELIVERY" && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="flex items-center">Toimitusmaksu</span>
                      <span className="font-semibold">
                        {(order.final_delivery_fee || 0).toFixed(2)} €
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 font-bold text-lg">
                    <span>Yhteensä</span>
                    <span>{calculateOrderTotal(order).toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Confirmation Section for NEW orders */}
              {status === "NEW" && (
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  {order.fulfillment_type === "DELIVERY" && (
                    <div className="mb-4">
                      <Label htmlFor={`delivery-fee-${order.id}`}>
                        Lopullinen toimitusmaksu (€)
                      </Label>
                      <Input
                        id={`delivery-fee-${order.id}`}
                        type="number"
                        step="1"
                        min="0"
                        value={deliveryFee}
                        onChange={(e) =>
                          setDeliveryFee(parseFloat(e.target.value) || 0)
                        }
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={() => handleConfirmOrder(order.id)}
                      disabled={processingState[order.id]}
                      className="w-full"
                    >
                      Vahvista tilaus
                    </Button>

                    <ConfirmationDialog
                      triggerButton={
                        <Button
                          variant="destructive"
                          disabled={processingState[order.id]}
                          className="w-full"
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Peruuta tilaus
                        </Button>
                      }
                      title="Peruuta tilaus"
                      description="Haluatko varmasti peruuttaa tämän tilauksen? Tilatut tuotteet palautetaan automaattisesti varastoon."
                      onConfirm={() => handleCancelOrder(order)}
                      confirmActionText="Kyllä, peruuta tilaus"
                      isDestructive={true}
                    />
                  </div>
                </div>
              )}

              {/* Action Section for CONFIRMED orders */}
              {status === "CONFIRMED" && (
                <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-2">
                  <ConfirmationDialog
                    triggerButton={
                      <Button
                        variant="default"
                        disabled={processingState[order.id]}
                        className="w-full"
                      >
                        <PackageCheck className="mr-1 h-4 w-4" />
                        Merkitse valmiiksi
                      </Button>
                    }
                    title="Merkitse tilaus valmiiksi?"
                    description="Tämä toiminto on lopullinen, eikä tilausta voi enää peruuttaa sen jälkeen. Haluatko varmasti jatkaa?"
                    onConfirm={() => handleMarkCompleted(order.id)}
                    confirmActionText="Kyllä, merkitse valmiiksi"
                    isDestructive={false}
                  />

                  <ConfirmationDialog
                    triggerButton={
                      <Button
                        variant="destructive"
                        disabled={processingState[order.id]}
                        className="w-full"
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Peruuta tilaus
                      </Button>
                    }
                    title="Peruuta tilaus"
                    description="Haluatko varmasti peruuttaa tämän tilauksen? Tilatut tuotteet palautetaan automaattisesti varastoon."
                    onConfirm={() => handleCancelOrder(order)}
                    confirmActionText="Kyllä, peruuta tilaus"
                    isDestructive={true}
                  />
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
