import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Clock, MapPin, Phone, User, XCircle, Truck, ShoppingBag } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

/**
 * Interface representing an order with all related data
 */
interface Order {
  id: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  fulfillment_type: 'PICKUP' | 'DELIVERY';
  final_delivery_fee: number;
  status: 'NEW' | 'CONFIRMED' | 'CANCELLED';
  created_at: string;
  fulfillment_slot: {
    start_time: string;
    end_time: string;
    type: 'PICKUP' | 'DELIVERY';
  };
  order_items: {
    id: string;
    quantity: number;
    product: {
      species: string;
      form: string;
      price_per_kg: number;
    };
  }[];
}

/**
 * Props for the OrdersList component
 */
interface OrdersListProps {
  /** ID of the fisherman's profile */
  fishermanProfileId: string;
  /** Status filter for orders to display */
  status: 'NEW' | 'CONFIRMED' | 'CANCELLED';
  /** Default delivery fee for new orders */
  defaultDeliveryFee: number;
}

/**
 * Component for displaying and managing orders for a specific fisherman.
 * 
 * Features:
 * - Lists orders filtered by status (NEW, CONFIRMED, CANCELLED)
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
export const OrdersList = ({ fishermanProfileId, status, defaultDeliveryFee }: OrdersListProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(defaultDeliveryFee);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { toast } = useToast();
  const { refreshNotifications } = useNotifications();

  /**
   * Fetches orders for the fisherman filtered by status
   */
  const fetchOrders = async () => {
    try {
      // First, get all fulfillment slot IDs for this fisherman
      const { data: slotData, error: slotError } = await supabase
        .from('fulfillment_slots')
        .select('id')
        .eq('fisherman_id', fishermanProfileId);

      if (slotError) throw slotError;

      const slotIds = slotData?.map(slot => slot.id) || [];
      
      if (slotIds.length === 0) {
        setOrders([]);
        return;
      }

      // Then fetch orders for those slots
      const { data, error } = await supabase
        .from('orders')
        .select(`
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
        `)
        .eq('status', status)
        .in('fulfillment_slot_id', slotIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Tilausten lataaminen epäonnistui.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fishermanProfileId, status]);

  /**
   * Confirms an order and sends confirmation email to customer
   * @param orderId - ID of the order to confirm
   */
  const handleConfirmOrder = async (orderId: string) => {
    setConfirming(orderId);
    try {
      // Update order status to CONFIRMED
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'CONFIRMED',
          final_delivery_fee: deliveryFee
        })
        .eq('id', orderId);

      if (error) throw error;

      // Send confirmation email to customer
      try {
        const { data, error: functionError } = await supabase.functions.invoke('send-order-confirmation', {
          body: { orderId }
        });

        if (functionError) {
          console.error('Error sending confirmation email:', functionError);
          toast({
            variant: "destructive",
            title: "Varoitus",
            description: "Tilaus vahvistettiin, mutta vahvistussähköpostin lähetys epäonnistui.",
          });
        } else {
          console.log('Confirmation email sent successfully');
        }
      } catch (emailError) {
        console.error('Error with confirmation email function:', emailError);
      }

      toast({
        title: "Tilaus vahvistettu",
        description: "Tilaus on vahvistettu ja asiakas on saanut vahvistussähköpostin.",
      });

      fetchOrders();
      refreshNotifications();
      setExpandedOrder(null);
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Tilauksen vahvistaminen epäonnistui.",
      });
    } finally {
      setConfirming(null);
    }
  };

  /**
   * Cancels an order and restores inventory for all order items
   * @param order - The order to cancel
   */
  const handleCancelOrder = async (order: Order) => {
    setCancelling(order.id);
    try {
      // Start by updating the order status to CANCELLED
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'CANCELLED' })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // Restore inventory for each order item
      for (const item of order.order_items) {
        // Get the product ID from the order_items table
        const { data: orderItemData, error: orderItemError } = await supabase
          .from('order_items')
          .select('product_id')
          .eq('id', item.id)
          .single();

        if (orderItemError) throw orderItemError;

        // Get current product quantity and restore the ordered amount
        const { data: currentProduct, error: fetchError } = await supabase
          .from('products')
          .select('available_quantity')
          .eq('id', orderItemData.product_id)
          .single();

        if (fetchError) throw fetchError;

        // Update the product quantity by adding back the cancelled amount
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            available_quantity: currentProduct.available_quantity + item.quantity 
          })
          .eq('id', orderItemData.product_id);

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
      console.error('Error cancelling order:', error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Tilauksen peruuttaminen epäonnistui.",
      });
    } finally {
      setCancelling(null);
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
      const order = orders.find(o => o.id === orderId);
      if (order && order.fulfillment_type === 'DELIVERY') {
        setDeliveryFee(order.final_delivery_fee || defaultDeliveryFee);
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
      return sum + (item.quantity * item.product.price_per_kg);
    }, 0);
    
    const fee = order.fulfillment_type === 'DELIVERY' ? (order.final_delivery_fee || 0) : 0;
    return itemsTotal + fee;
  };

  /**
   * Returns the appropriate badge variant for order status
   * @param orderStatus - The status of the order
   * @returns Badge variant string
   */
  const getStatusBadgeVariant = (orderStatus: string) => {
    switch (orderStatus) {
      case 'NEW':
        return 'destructive';
      case 'CONFIRMED':
        return 'default';
      case 'CANCELLED':
        return 'outline';
      default:
        return 'outline';
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
          {status === 'NEW' && 'Ei uusia tilauksia.'}
          {status === 'CONFIRMED' && 'Ei vahvistettuja tilauksia.'}
          {status === 'CANCELLED' && 'Ei peruttuja tilauksia.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="transition-all duration-200">
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => toggleOrderExpansion(order.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                  </p>
                </div>
                <Badge variant={order.fulfillment_type === 'PICKUP' ? 'outline' : 'secondary'}>
                  {order.fulfillment_type === 'PICKUP' ? 'Nouto' : 'Kotiinkuljetus'}
                </Badge>
                <Badge variant={getStatusBadgeVariant(order.status)}>
                  {order.status === 'NEW' && 'Uusi'}
                  {order.status === 'CONFIRMED' && 'Vahvistettu'}
                  {order.status === 'CANCELLED' && 'Peruttu'}
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
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Asiakkaan tiedot
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nimi:</strong> {order.customer_name}</p>
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
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Toimitustiedot
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center">
                      <strong className="mr-2">Tyyppi:</strong> 
                      {order.fulfillment_type === 'PICKUP' ? (
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
                    <p><strong>Aika:</strong> {format(new Date(order.fulfillment_slot.start_time), 'dd.MM.yyyy HH:mm', { locale: fi })} - {format(new Date(order.fulfillment_slot.end_time), 'HH:mm', { locale: fi })}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Tilatut tuotteet</h4>
                <div className="space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <span className="font-medium">{item.product.species}</span>
                        <span className="text-muted-foreground ml-2">({item.product.form})</span>
                      </div>
                      <div className="text-right">
                        <div>{item.quantity} kg × {item.product.price_per_kg.toFixed(2)} €/kg</div>
                        <div className="font-semibold">
                          {(item.quantity * item.product.price_per_kg).toFixed(2)} €
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {order.fulfillment_type === 'DELIVERY' && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Toimitusmaksu</span>
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
              {status === 'NEW' && (
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  {order.fulfillment_type === 'DELIVERY' && (
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
                        onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleConfirmOrder(order.id)}
                      disabled={confirming === order.id || cancelling === order.id}
                      className="w-full"
                    >
                      {confirming === order.id ? 'Vahvistetaan...' : 'Vahvista tilaus'}
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          disabled={confirming === order.id || cancelling === order.id}
                          className="w-full"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          {cancelling === order.id ? 'Peruutetaan...' : 'Peruuta tilaus'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Peruuta tilaus</AlertDialogTitle>
                          <AlertDialogDescription>
                            Haluatko varmasti peruuttaa tämän tilauksen? Tilatut tuotteet palautetaan automaattisesti varastoon.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Älä peruuta</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelOrder(order)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Kyllä, peruuta tilaus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};