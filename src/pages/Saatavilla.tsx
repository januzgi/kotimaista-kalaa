import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { Fish, Package, Euro, ShoppingCart } from "lucide-react";
import { FishIcon } from "@/components/FishIcon";
import { Product } from "@/lib/types";
import { Link } from "react-router-dom";

/**
 * Available fish products page component.
 *
 * Features:
 * - Lists all available fish products from all fishermen
 * - Shows product details (species, form, price, availability)
 * - Quantity selection with min/max validation
 * - Add to cart functionality
 * - Real-time inventory checking
 * - Responsive grid layout
 * - Loading and empty states
 *
 * Products are filtered to only show items with available quantity > 0
 * and sorted by creation date (newest first).
 *
 * @returns The available fish products listing page
 */
const Saatavilla = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<{ [productId: string]: string }>(
    {}
  );
  const { toast } = useToast();
  const { items, addItem, isInCart } = useCart();
  const { user, openAuthDialog } = useAuth();

  /**
   * Fetches all available products from the database
   * Includes related fisherman and catch information
   */
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc("get_available_products");

      if (error) throw error;
      const correctlyTypedProducts = (data as unknown as Product[]) || [];
      setProducts(correctlyTypedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Tuotteiden lataaminen epäonnistui.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Effect to fetch products when component mounts
   */
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /**
   * Effect to update product amount input values if they are already in the cart
   */
  useEffect(() => {
    if (products.length > 0) {
      const newQuantities = products.reduce((acc, product) => {
        // Check if the current product is already in the cart
        const itemInCart = items.find((item) => item.productId === product.id);

        // If it is, use its quantity. If not, default to "1".
        acc[product.id] = itemInCart
          ? itemInCart.quantity.toString()
          : Math.min(1, product.available_quantity).toString();

        return acc;
      }, {} as { [productId: string]: string });

      setQuantities(newQuantities);
    }
  }, [products, items]);

  /**
   * Handles adding a product to the shopping cart
   * @param product - The product to add to the cart
   */
  const handleAddToCart = (product: Product) => {
    if (!user) {
      openAuthDialog();
      return;
    }

    const quantityString = quantities[product.id] || "1";
    const numericQuantity = parseFloat(quantityString.replace(",", "."));

    addItem({
      productId: product.id,
      species: product.species,
      form: product.form,
      pricePerKg: product.price_per_kg,
      quantity: numericQuantity,
      fishermanName: product.fisherman_profile?.user?.full_name || "Tuntematon",
      availableQuantity: product.available_quantity,
    });

    toast({
      title: "Tuote lisätty ostoskoriin",
      description: `${product.species} × ${quantityString}kg (${product.form}) lisätty ostoskoriin.`,
    });
  };

  /**
   * Handles quantity input changes with validation
   * @param productId - ID of the product
   * @param value - New quantity value as string
   */
  const handleQuantityChange = (productId: string, value: string) => {
    // Replace comma with a period for universal parsing
    const formattedValue = value.replace(",", ".");
    const product = products.find((p) => p.id === productId);

    // Allow empty input or valid number patterns
    if (formattedValue === "" || /^[0-9]*\.?[0-9]*$/.test(formattedValue)) {
      const numValue = parseFloat(formattedValue);

      // Cap at max value if it's a valid number and too high
      if (
        product &&
        !isNaN(numValue) &&
        numValue > product.available_quantity
      ) {
        setQuantities((prev) => ({
          ...prev,
          [productId]: product.available_quantity.toString(),
        }));
      } else {
        setQuantities((prev) => ({
          ...prev,
          [productId]: formattedValue,
        }));
      }
    }
  };

  /**
   * Handles blur event for quantity input, enforcing minimum value.
   * @param productId - ID of the product
   */
  const handleQuantityBlur = (productId: string) => {
    // Parse the current string value, replacing comma with period
    let numericValue =
      parseFloat(quantities[productId]?.replace(",", ".")) || 0;

    // Enforce the minimum value of 0.1
    if (numericValue < 0.1) {
      numericValue = 0.1;
    }

    // Round the value to one decimal place (100g increments)
    const roundedValue = Math.round(numericValue * 10) / 10;

    // Update the state with the cleaned, rounded value as a string
    setQuantities((prev) => ({
      ...prev,
      [productId]: roundedValue.toString(),
    }));
  };

  /**
   * Formats a date string to DD.MM. format
   * @param dateString - ISO date string
   * @returns Formatted date string (DD.MM.)
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate());
    const month = String(date.getMonth() + 1);
    return `${day}.${month}.`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ladataan tuotteita...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative max-w-[var(--saatavilla-container-width)]">
      <div className="mb-8 max-w-[var(--admin-side-container-width)] mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Saatavilla oleva kala
        </h1>
        <p className="text-muted-foreground">
          Tuoretta kotimaista kalaa suoraan kalastajalta
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Fish className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Ei tuotteita saatavilla
          </h2>
          <p className="text-muted-foreground">
            Tällä hetkellä ei ole tuoreita kaloja myynnissä. Tarkista myöhemmin
            uudelleen!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="transition-all duration-200 hover:shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <FishIcon species={product.species} />
                    {product.species}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs w-fit">
                  pyyntipäivä: {formatDate(product.catch.catch_date)}
                </Badge>
                <div className="text-xs text-muted-foreground w-fit">
                  Kalastaja:{" "}
                  {product.fisherman_profile?.user?.full_name || "Tuntematon"}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm">
                      <Package className="mr-1 h-4 w-4" />
                      Muoto:
                    </span>
                    <Badge variant="secondary">{product.form}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm">
                      <Euro className="mr-1 h-4 w-4" />
                      Hinta:
                    </span>
                    <span className="font-semibold">
                      {product.price_per_kg.toFixed(2)} €/kg
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Saatavilla:</span>
                    <span className="font-medium">
                      {product.available_quantity} kg
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-center">
                  <div className="mx-auto w-fit">
                    <label
                      htmlFor={`quantity-${product.id}`}
                      className="block text-sm font-medium mb-1"
                    >
                      Määrä (kg)
                    </label>
                    <Input
                      id={`quantity-${product.id}`}
                      type="number"
                      max={product.available_quantity}
                      step={0.1}
                      value={quantities[product.id] || ""}
                      onChange={(e) =>
                        handleQuantityChange(product.id, e.target.value)
                      }
                      onBlur={() => handleQuantityBlur(product.id)}
                      disabled={isInCart(product.id)}
                      className="w-[200px]"
                    />
                  </div>

                  <Button
                    onClick={() => handleAddToCart(product)}
                    disabled={isInCart(product.id)}
                    className="w-[200px]"
                    size="sm"
                    variant={isInCart(product.id) ? "secondary" : "default"}
                  >
                    {isInCart(product.id) ? "Korissa" : "Lisää ostoskoriin"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <div className="mt-12 p-2 w-fit rounded-lg bg-background mx-auto text-center bottom-4 sticky">
          <Link to="/ostoskori">
            <Button size="lg" className="hover:bg-primary">
              <ShoppingCart className="h-4 w-4" />
              Siirry ostoskoriin ({items.length})
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Saatavilla;
