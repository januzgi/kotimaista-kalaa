import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Fish, Package, Euro } from 'lucide-react';

/**
 * Interface defining the structure of a product from the database
 */
interface Product {
  id: string;
  species: string;
  form: string;
  price_per_kg: number;
  available_quantity: number;
  catch: {
    catch_date: string;
  };
  fisherman_profile: {
    user: {
      full_name: string;
    };
  };
}

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
  const [quantities, setQuantities] = useState<{ [productId: string]: number }>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem, isInCart } = useCart();

  /**
   * Effect to fetch products when component mounts
   */
  useEffect(() => {
    fetchProducts();
  }, []);

  /**
   * Fetches all available products from the database
   * Includes related fisherman and catch information
   */
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          species,
          form,
          price_per_kg,
          available_quantity,
          catch:catches(
            catch_date
          ),
          fisherman_profile:fisherman_profiles(
            user:users(
              full_name
            )
          )
        `)
        .gt('available_quantity', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const productsData = data || [];
      setProducts(productsData);
      
      // Initialize quantities with default value of 1 for each product
      const initialQuantities: { [productId: string]: number } = {};
      productsData.forEach(product => {
        initialQuantities[product.id] = 1;
      });
      setQuantities(initialQuantities);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Tuotteiden lataaminen epäonnistui.",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles adding a product to the shopping cart
   * @param product - The product to add to the cart
   */
  const handleAddToCart = (product: Product) => {
    const selectedQuantity = quantities[product.id] || 1;
    addItem({
      productId: product.id,
      species: product.species,
      form: product.form,
      pricePerKg: product.price_per_kg,
      quantity: selectedQuantity,
      fishermanName: product.fisherman_profile?.user?.full_name || 'Tuntematon',
      availableQuantity: product.available_quantity
    });

    toast({
      title: "Tuote lisätty ostoskoriin",
      description: `${selectedQuantity} kg ${product.species} (${product.form}) lisätty ostoskoriin.`,
    });
  };

  /**
   * Handles quantity input changes with validation
   * @param productId - ID of the product
   * @param value - New quantity value as string
   */
  const handleQuantityChange = (productId: string, value: string) => {
    const numValue = parseFloat(value);
    const product = products.find(p => p.id === productId);
    if (product && numValue >= 0.1 && numValue <= product.available_quantity) {
      setQuantities(prev => ({
        ...prev,
        [productId]: numValue
      }));
    }
  };

  /**
   * Formats a date string to Finnish locale format
   * @param dateString - ISO date string
   * @returns Formatted date string (DD.MM.YYYY)
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Ladataan tuotteita...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">Saatavilla oleva kala</h1>
          <p className="text-muted-foreground">
            Tuoretta kotimaista kalaa suoraan kalastajalta
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <Fish className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ei tuotteita saatavilla</h2>
            <p className="text-muted-foreground">
              Tällä hetkellä ei ole tuoreita kaloja myynnissä. Tarkista myöhemmin uudelleen!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="transition-all duration-200 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Fish className="mr-2 h-5 w-5 text-primary" />
                      {product.species}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {formatDate(product.catch.catch_date)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Kalastaja: {product.fisherman_profile?.user?.full_name || 'Tuntematon'}
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
                      <span className="font-semibold">{product.price_per_kg.toFixed(2)} €/kg</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Saatavilla:</span>
                      <span className="font-medium">{product.available_quantity} kg</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor={`quantity-${product.id}`} className="block text-sm font-medium mb-1">
                        Määrä (kg)
                      </label>
                      <Input
                        id={`quantity-${product.id}`}
                        type="number"
                        min={0.1}
                        max={product.available_quantity}
                        step={0.1}
                        value={quantities[product.id] || 1}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        disabled={isInCart(product.id)}
                        className="w-full"
                      />
                    </div>

                    <Button 
                      onClick={() => handleAddToCart(product)}
                      disabled={isInCart(product.id)}
                      className="w-full"
                      size="sm"
                      variant={isInCart(product.id) ? "secondary" : "default"}
                    >
                      {isInCart(product.id) ? 'Korissa' : 'Lisää ostoskoriin'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Saatavilla;