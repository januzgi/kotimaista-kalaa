import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Clock, MapPin, Phone, User } from 'lucide-react';

interface Order {
  id: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  fulfillment_type: 'PICKUP' | 'DELIVERY';
  final_delivery_fee: number;
  status: 'NEW' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
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

interface OrdersListProps {
  fishermanProfileId: string;
  status: 'NEW' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  defaultDeliveryFee: number;
}

export const OrdersList = ({ fishermanProfileId, status, defaultDeliveryFee }: OrdersListProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(defaultDeliveryFee);
  const [confirming, setConfirming] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleConfirmOrder = async (orderId: string) => {
    setConfirming(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'CONFIRMED',
          final_delivery_fee: deliveryFee
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Tilaus vahvistettu",
        description: "Tilaus on vahvistettu onnistuneesti.",
      });

      fetchOrders();
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

  const calculateOrderTotal = (order: Order) => {
    const itemsTotal = order.order_items.reduce((sum, item) => {
      return sum + (item.quantity * item.product.price_per_kg);
    }, 0);
    
    const fee = order.fulfillment_type === 'DELIVERY' ? (order.final_delivery_fee || 0) : 0;
    return itemsTotal + fee;
  };

  const getStatusBadgeVariant = (orderStatus: string) => {
    switch (orderStatus) {
      case 'NEW':
        return 'destructive';
      case 'CONFIRMED':
        return 'default';
      case 'COMPLETED':
        return 'secondary';
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
          {status === 'COMPLETED' && 'Ei valmistuneita tilauksia.'}
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
                  {order.status === 'COMPLETED' && 'Valmis'}
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
                    <p><strong>Tyyppi:</strong> {order.fulfillment_type === 'PICKUP' ? 'Nouto' : 'Kotiinkuljetus'}</p>
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
                        step="0.01"
                        min="0"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                  )}
                  
                  <Button
                    onClick={() => handleConfirmOrder(order.id)}
                    disabled={confirming === order.id}
                    className="w-full"
                  >
                    {confirming === order.id ? 'Vahvistetaan...' : 'Vahvista tilaus'}
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};