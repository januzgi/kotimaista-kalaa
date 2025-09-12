import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import { Fish, MapPin, Clock, Euro, User, Phone, Home } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FishIcon } from "@/components/FishIcon";
import { FulfillmentSlot, Product } from "@/lib/types";

/**
 * Order placement page component.
 *
 * Features:
 * - Cart items summary and pricing
 * - Customer information form (auto-filled for logged users)
 * - Fulfillment method selection (pickup/delivery)
 * - Time slot selection for order fulfillment
 * - Address input for delivery orders
 * - Terms acceptance checkbox
 * - Order validation and submission
 * - Real-time inventory checking during order placement
 * - Sold-out item handling with cart updates
 *
 * The component handles both single-product orders (legacy) and multi-item
 * cart orders, with automatic validation and error handling throughout
 * the order process.
 *
 * @returns The order placement page component
 */
const Tilaa = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("product");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { items: cartItems, clearCart, removeItemsById } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [fulfillmentSlots, setFulfillmentSlots] = useState<FulfillmentSlot[]>(
    []
  );
  const [allSlots, setAllSlots] = useState<FulfillmentSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"PICKUP" | "DELIVERY">(
    "PICKUP"
  );
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const fetchProductData = useCallback(async () => {
    if (cartItems.length === 0) return;

    try {
      // Get unique product IDs from cart
      const productIds = [...new Set(cartItems.map((item) => item.productId))];

      // Call the new RPC function with the product IDs
      const { data, error } = await supabase.rpc("get_products_by_ids", {
        product_ids_param: productIds,
      });

      if (error) throw error;

      const productsData = data as unknown as Product[];
      if (productsData && productsData.length > 0) {
        // Use the first product's fisherman profile for fulfillment details
        setProduct(productsData[0]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Tuotteiden lataaminen epäonnistui.",
      });
      navigate("/saatavilla");
    }
  }, [cartItems, navigate, toast]);

  const fetchUserProfile = useCallback(async () => {
    if (!user) return;

    // The name is already in the auth object
    setCustomerName(user.user_metadata.full_name || "");

    try {
      const { data, error } = await supabase
        .from("users")
        .select("phone_number")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setCustomerPhone(data.phone_number || "");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, [user]);

  const fetchFulfillmentSlots = useCallback(async () => {
    if (!product) return;

    try {
      // Fetch all slots for this fisherman to check availability
      const { data: allSlots, error } = await supabase
        .from("fulfillment_slots")
        .select("id, start_time, end_time, type")
        .eq("fisherman_id", product.fisherman_profile.id)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;

      const slots = allSlots || [];
      const deliverySlots = slots.filter((slot) => slot.type === "DELIVERY");
      const pickupSlots = slots.filter((slot) => slot.type === "PICKUP");

      // If there are no delivery slots but there are pickup slots, switch to pickup
      if (
        fulfillmentType === "DELIVERY" &&
        deliverySlots.length === 0 &&
        pickupSlots.length > 0
      ) {
        setFulfillmentType("PICKUP");
        setFulfillmentSlots(pickupSlots);
      } else {
        // Filter by current fulfillment type
        setFulfillmentSlots(
          slots.filter((slot) => slot.type === fulfillmentType)
        );
      }

      setSelectedSlotId("");
    } catch (error) {
      console.error("Error fetching fulfillment slots:", error);
    } finally {
      setLoading(false);
    }
  }, [fulfillmentType, product]);

  useEffect(() => {
    // If there's a productId, we're coming from the old single-product flow
    // Redirect to cart page instead
    if (productId) {
      navigate("/ostoskori");
      return;
    }

    // If cart is empty, redirect to available products
    if (cartItems.length === 0) {
      navigate("/saatavilla");
      return;
    }

    fetchProductData();
  }, [productId, cartItems.length, fetchProductData, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [fetchUserProfile, user]);

  useEffect(() => {
    if (product) {
      fetchFulfillmentSlots();
    }
  }, [product, fulfillmentType, fetchFulfillmentSlots]);

  useEffect(() => {
    const fetchAllSlots = async () => {
      if (!product) return;

      try {
        const { data, error } = await supabase
          .from("fulfillment_slots")
          .select("id, start_time, end_time, type")
          .eq("fisherman_id", product.fisherman_profile.id)
          .gte("start_time", new Date().toISOString());

        if (!error) {
          setAllSlots(data || []);
        }
      } catch (error) {
        console.error("Error fetching all slots:", error);
      }
    };

    fetchAllSlots();
  }, [product]);

  const calculateTotal = () => {
    if (!cartItems.length) return 0;

    const itemsTotal = cartItems.reduce(
      (sum, item) => sum + item.quantity * item.pricePerKg,
      0
    );
    const deliveryFee =
      fulfillmentType === "DELIVERY" && product
        ? product.fisherman_profile.default_delivery_fee
        : 0;
    return itemsTotal + deliveryFee;
  };

  const handleSubmitOrder = async () => {
    if (!product || !user || cartItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Virhe",
        description:
          "Kirjaudu sisään ja lisää tuotteita ostoskoriin tehdäksesi tilauksen.",
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

    if (fulfillmentType === "DELIVERY" && !customerAddress) {
      toast({
        variant: "destructive",
        title: "Puuttuvia tietoja",
        description: "Toimitusosoite on pakollinen kotiinkuljetukselle.",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Prepare cart data for the edge function
      const cartData = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const orderData = {
        cartItems: cartData,
        customerName,
        customerPhone,
        customerAddress:
          fulfillmentType === "DELIVERY" ? customerAddress : undefined,
        fulfillmentType,
        fulfillmentSlotId: selectedSlotId,
      };

      const { data, error } = await supabase.functions.invoke("create-order", {
        body: orderData,
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to create order");
      }

      if (data.error) {
        if (data.error === "Items sold out") {
          // Handle sold out items
          // Remove sold out items from cart
          if (data.soldOutProductIds && data.soldOutProductIds.length > 0) {
            removeItemsById(data.soldOutProductIds);
          }

          toast({
            variant: "destructive",
            title: "Tuotteet loppuunmyytyjä",
            description: `Seuraavat tuotteet ehdittiin myydä loppuun: ${data.soldOutItems.join(
              ", "
            )}`,
          });

          // Redirect to cart page
          navigate("/ostoskori");
          return;
        } else {
          throw new Error(data.error);
        }
      }

      // Success - clear cart and redirect
      clearCart();

      toast({
        title: "Tilaus lähetetty!",
        description: "Tilauksesi on vastaanotettu ja odottaa vahvistusta.",
      });

      navigate("/kiitos");
    } catch (error) {
      console.error("Error submitting order:", error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Tilauksen lähettäminen epäonnistui. Yritä uudelleen.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !product || cartItems.length === 0) {
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

  const availableSlots = fulfillmentSlots.filter(
    (slot) => slot.type === fulfillmentType
  );

  const hasDeliverySlots = allSlots.some((slot) => slot.type === "DELIVERY");
  const hasPickupSlots = allSlots.some((slot) => slot.type === "PICKUP");
  const hasAnySlots = allSlots.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">
            Tee tilaus
          </h1>
          <p className="text-muted-foreground">
            Täytä tiedot ja valitse toimitustapa
          </p>
        </div>

        <div className="space-y-6">
          {/* Cart Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Fish className="mr-2 h-5 w-5 text-primary" />
                Tilattavat tuotteet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg"
                >
                  <div className="flex gap-2 items-center">
                    <FishIcon species={item.species} className="h-8 w-8" />
                    <h3 className="font-semibold">{item.species}</h3>
                    <p className="text-muted-foreground">{item.form}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {item.pricePerKg.toFixed(2)} €/kg
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} kg ={" "}
                      {(item.quantity * item.pricePerKg).toFixed(2)} €
                    </p>
                  </div>
                </div>
              ))}
              <div className="text-right pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Tuotteet yhteensä:
                </p>
                <p className="font-semibold text-lg">
                  {cartItems
                    .reduce(
                      (sum, item) => sum + item.quantity * item.pricePerKg,
                      0
                    )
                    .toFixed(2)}{" "}
                  €
                </p>
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
                onValueChange={(value: "PICKUP" | "DELIVERY") =>
                  setFulfillmentType(value)
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="PICKUP"
                    id="pickup"
                    disabled={!hasPickupSlots}
                  />
                  <Label
                    htmlFor="pickup"
                    className={!hasPickupSlots ? "text-muted-foreground" : ""}
                  >
                    Nouto {!hasPickupSlots && "(ei saatavilla)"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="DELIVERY"
                    id="delivery"
                    disabled={!hasDeliverySlots}
                  />
                  <Label
                    htmlFor="delivery"
                    className={!hasDeliverySlots ? "text-muted-foreground" : ""}
                  >
                    Kotiinkuljetus {!hasDeliverySlots && "(ei saatavilla)"}
                  </Label>
                </div>
              </RadioGroup>

              {fulfillmentType === "PICKUP" && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start space-x-2 mb-3">
                    <Home className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Nouto-osoite:</p>
                      <p className="text-muted-foreground">
                        {product.fisherman_profile.pickup_address}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {fulfillmentType === "DELIVERY" && (
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
                        alk.{" "}
                        {product.fisherman_profile.default_delivery_fee.toFixed(
                          2
                        )}{" "}
                        €
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Lopullinen toimitusmaksu vahvistetaan
                      tilausvahvistuksessa.
                    </p>
                  </div>
                </div>
              )}

              {/* Time Slots */}
              {hasAnySlots ? (
                <div>
                  <Label htmlFor="timeslot" className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    Valitse aika *
                  </Label>
                  <Select
                    value={selectedSlotId}
                    onValueChange={setSelectedSlotId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Valitse aikaväli" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {format(
                            new Date(slot.start_time),
                            "dd.MM.yyyy HH:mm",
                            { locale: fi }
                          )}{" "}
                          -{" "}
                          {format(new Date(slot.end_time), "HH:mm", {
                            locale: fi,
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableSlots.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Ei saatavilla olevia aikoja valitulle toimitustavalle.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Phone className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm">
                        <strong>
                          Nouto- tai kotiinkuljetusaikoja ei ole määritelty.
                        </strong>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sovi suoraan kalastajan kanssa noutoajasta:{" "}
                        {product.fisherman_profile.public_phone_number ? (
                          <a
                            href={`tel:${product.fisherman_profile.public_phone_number}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {product.fisherman_profile.public_phone_number}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            Puhelinnumeroa ei ole saatavilla
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span>
                      {item.species} ({item.quantity} kg ×{" "}
                      {item.pricePerKg.toFixed(2)} €/kg)
                    </span>
                    <span>
                      {(item.quantity * item.pricePerKg).toFixed(2)} €
                    </span>
                  </div>
                ))}
                {fulfillmentType === "DELIVERY" && product && (
                  <div className="flex justify-between">
                    <span>Toimitusmaksu (alkaen)</span>
                    <span>
                      {product.fisherman_profile.default_delivery_fee.toFixed(
                        2
                      )}{" "}
                      €
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Yhteensä (alkaen)</span>
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
            <Label
              htmlFor="terms"
              className="text-sm leading-relaxed cursor-pointer"
            >
              Olen lukenut ja hyväksyn{" "}
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
            disabled={
              submitting ||
              (!hasAnySlots && !selectedSlotId) ||
              !customerName ||
              !customerPhone ||
              !acceptedTerms ||
              (fulfillmentType === "DELIVERY" && !customerAddress) ||
              cartItems.length === 0
            }
            className="w-full"
            size="lg"
          >
            {submitting ? "Lähetetään..." : "Tee tilaus"}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Tilaa;
