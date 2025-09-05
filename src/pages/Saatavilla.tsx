import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { Fish, Package, Euro } from 'lucide-react';

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

const Saatavilla = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

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
      setProducts(data || []);
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

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      species: product.species,
      form: product.form,
      pricePerKg: product.price_per_kg,
      quantity: 1,
      fishermanName: product.fisherman_profile?.user?.full_name || 'Tuntematon',
      availableQuantity: product.available_quantity
    });

    toast({
      title: "Tuote lisätty ostoskoriin",
      description: `${product.species} (${product.form}) lisätty ostoskoriin.`,
    });
  };

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

                  <Button 
                    onClick={() => handleAddToCart(product)}
                    className="w-full"
                    size="sm"
                  >
                    Lisää ostoskoriin
                  </Button>
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