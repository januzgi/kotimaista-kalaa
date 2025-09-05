import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Fish, MapPin, Clock, Euro, User, Phone, Home } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Product {
  id: string;
  species: string;
  form: string;
  price_per_kg: number;
  available_quantity: number;
  fisherman_profile: {
    id: string;
    pickup_address: string;
    default_delivery_fee: number;
    user: {
      full_name: string;
    };
  };
}

interface FulfillmentSlot {
  id: string;
  start_time: string;
  end_time: string;
  type: 'PICKUP' | 'DELIVERY';
}

const Tilaa = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [fulfillmentSlots, setFulfillmentSlots] = useState<FulfillmentSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!productId) {
      navigate('/saatavilla');
      return;
    }
    fetchProductData();
  }, [productId]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (product) {
      fetchFulfillmentSlots();
    }
  }, [product, fulfillmentType]);

  const fetchProductData = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          species,
          form,
          price_per_kg,
          available_quantity,
          fisherman_profile:fisherman_profiles(
            id,
            pickup_address,
            default_delivery_fee,
            user:users(
              full_name
            )
          )
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Tuotteen lataaminen epäonnistui.",
      });
      navigate('/saatavilla');
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name, phone_number')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setCustomerName(data.full_name || '');
        setCustomerPhone(data.phone_number || '');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchFulfillmentSlots = async () => {
    if (!product) return;

    try {
      const { data, error } = await supabase
        .from('fulfillment_slots')
        .select('id, start_time, end_time, type')
        .eq('fisherman_id', product.fisherman_profile.id)
        .eq('type', fulfillmentType)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      setFulfillmentSlots(data || []);
      setSelectedSlotId('');
    } catch (error) {
      console.error('Error fetching fulfillment slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const itemsTotal = quantity * product.price_per_kg;
    const deliveryFee = fulfillmentType === 'DELIVERY' ? product.fisherman_profile.default_delivery_fee : 0;
    return itemsTotal + deliveryFee;
  };

  const handleSubmitOrder = async () => {
    if (!product || !user) {
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Kirjaudu sisään tehdäksesi tilauksen.",
      });
      return;
    }

    if (!customerName || !customerPhone || !selectedSlotId || !acceptedTerms) {
      toast({
        variant: "destructive",
        title: "Puuttuvia tietoja",
        description: "Täytä kaikki pakolliset kentät ja hyväksy toimitusehdot.",
      });
      return;
    }

    if (fulfillmentType === 'DELIVERY' && !customerAddress) {
      toast({
        variant: "destructive",
        title: "Puuttuvia tietoja",
        description: "Toimitusosoite on pakollinen kotiinkuljetukselle.",
      });
      return;
    }

    if (quantity > product.available_quantity) {
      toast({
        variant: "destructive",
        title: "Liikaa määrä",
        description: "Valittu määrä ylittää saatavilla olevan määrän.",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: fulfillmentType === 'DELIVERY' ? customerAddress : null,
          fulfillment_type: fulfillmentType,
          fulfillment_slot_id: selectedSlotId,
          final_delivery_fee: fulfillmentType === 'DELIVERY' ? product.fisherman_profile.default_delivery_fee : 0,
          status: 'NEW'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderData.id,
          product_id: product.id,
          quantity: quantity
        });

      if (itemError) throw itemError;

      // Update product quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({
          available_quantity: product.available_quantity - quantity
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      toast({
        title: "Tilaus lähetetty!",
        description: "Tilauksesi on vastaanotettu ja odottaa vahvistusta.",
      });

      navigate('/kiitos');
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Tilauksen lähettäminen epäonnistui.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Ladataan...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const availableSlots = fulfillmentSlots.filter(slot => slot.type === fulfillmentType);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">Tee tilaus</h1>
          <p className="text-muted-foreground">
            Täytä tiedot ja valitse toimitustapa
          </p>
        </div>

        <div className="space-y-6">
          {/* Product Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Fish className="mr-2 h-5 w-5 text-primary" />
                Tilattu tuote
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-lg">{product.species}</h3>
                  <p className="text-muted-foreground">{product.form}</p>
                  <p className="text-sm text-muted-foreground">
                    Kalastaja: {product.fisherman_profile.user.full_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{product.price_per_kg.toFixed(2)} €/kg</p>
                  <p className="text-sm text-muted-foreground">
                    Saatavilla: {product.available_quantity} kg
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="quantity">Määrä (kg)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={product.available_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Yhteensä tuotteesta:</p>
                  <p className="font-semibold text-lg">
                    {(quantity * product.price_per_kg).toFixed(2)} €
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" />
                Asiakkaan tiedot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nimi *</Label>
                  <Input
                    id="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Puhelinnumero *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fulfillment Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                Toimitustapa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup 
                value={fulfillmentType} 
                onValueChange={(value: 'PICKUP' | 'DELIVERY') => setFulfillmentType(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PICKUP" id="pickup" />
                  <Label htmlFor="pickup">Nouto</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DELIVERY" id="delivery" />
                  <Label htmlFor="delivery">Kotiinkuljetus</Label>
                </div>
              </RadioGroup>

              {fulfillmentType === 'PICKUP' && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start space-x-2 mb-3">
                    <Home className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Nouto-osoite:</p>
                      <p className="text-muted-foreground">{product.fisherman_profile.pickup_address}</p>
                    </div>
                  </div>
                </div>
              )}

              {fulfillmentType === 'DELIVERY' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Toimitusosoite *</Label>
                    <Input
                      id="address"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span>Toimitusmaksu:</span>
                      <span className="font-semibold">
                        alk. {product.fisherman_profile.default_delivery_fee.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Slots */}
              <div>
                <Label htmlFor="timeslot" className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  Valitse aika *
                </Label>
                <Select value={selectedSlotId} onValueChange={setSelectedSlotId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Valitse aikaikkunan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {format(new Date(slot.start_time), 'dd.MM.yyyy HH:mm', { locale: fi })} - {format(new Date(slot.end_time), 'HH:mm', { locale: fi })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableSlots.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Ei saatavilla olevia aikoja valitulle toimitstavalle.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Euro className="mr-2 h-5 w-5 text-primary" />
                Tilauksen yhteenveto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{product.species} ({quantity} kg × {product.price_per_kg.toFixed(2)} €/kg)</span>
                  <span>{(quantity * product.price_per_kg).toFixed(2)} €</span>
                </div>
                {fulfillmentType === 'DELIVERY' && (
                  <div className="flex justify-between">
                    <span>Toimitusmaksu</span>
                    <span>{product.fisherman_profile.default_delivery_fee.toFixed(2)} €</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Yhteensä</span>
                  <span>{calculateTotal().toFixed(2)} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2 p-4 bg-muted/20 rounded-lg">
            <Checkbox 
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              Olen lukenut ja hyväksyn{' '}
              <a 
                href="/toimitusehdot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                toimitusehdot
              </a>
              . Ymmärrän, että tilaus on sitova.
            </Label>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmitOrder}
            disabled={submitting || !selectedSlotId || availableSlots.length === 0 || !customerName || !customerPhone || !acceptedTerms || (fulfillmentType === 'DELIVERY' && !customerAddress)}
            className="w-full"
            size="lg"
          >
            {submitting ? 'Lähetetään...' : 'Tee tilaus'}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Tilaa;