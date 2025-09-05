import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useCart, CartItem } from '@/hooks/useCart';
import { ShoppingCart, Fish, Trash2, AlertTriangle, Euro, X } from 'lucide-react';

interface ProductAvailability {
  productId: string;
  currentAvailableQuantity: number;
}

const Ostoskori = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, updateQuantity, removeItem, getTotalPrice, removedItems, clearRemovedItems } = useCart();
  const [productAvailability, setProductAvailability] = useState<ProductAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInventory();
  }, [items]);

  const checkInventory = async () => {
    if (items.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const productIds = items.map(item => item.productId);
      const { data, error } = await supabase
        .from('products')
        .select('id, available_quantity')
        .in('id', productIds);

      if (error) throw error;

      const availability = data.map(product => ({
        productId: product.id,
        currentAvailableQuantity: product.available_quantity
      }));

      setProductAvailability(availability);
    } catch (error) {
      console.error('Error checking inventory:', error);
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Varastotietojen tarkistaminen epäonnistui.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getItemAvailability = (productId: string) => {
    return productAvailability.find(p => p.productId === productId);
  };

  const isSoldOut = (item: CartItem) => {
    const availability = getItemAvailability(item.productId);
    return availability && availability.currentAvailableQuantity === 0;
  };

  const hasUnavailableItems = () => {
    return items.some(item => isSoldOut(item));
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  const handleGoToCheckout = () => {
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Tyhjä ostoskori",
        description: "Lisää tuotteita ostoskoriin ennen kassalle siirtymistä.",
      });
      return;
    }

    if (hasUnavailableItems()) {
      toast({
        variant: "destructive",
        title: "Loppuunmyyty tuotteita",
        description: "Poista loppuunmyydyt tuotteet ostoskorista ennen kassalle siirtymistä.",
      });
      return;
    }

    navigate('/tilaa');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Tarkistetaan varastotilannetta...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2 flex items-center">
            <ShoppingCart className="mr-3 h-8 w-8" />
            Ostoskori
          </h1>
          <p className="text-muted-foreground">
            Tarkista tilauksesi ja siirry kassalle
          </p>
        </div>

        {removedItems.length > 0 && (
          <Alert className="mb-6 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
            <X className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-semibold">Huomio! Seuraavat tuotteet ehdittiin myydä loppuun ja ne on poistettu ostoskoristasi:</p>
                <ul className="list-disc list-inside">
                  {removedItems.map((itemName, index) => (
                    <li key={index}>{itemName}</li>
                  ))}
                </ul>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearRemovedItems}
                  className="mt-2 h-auto p-1 text-xs"
                >
                  Sulje ilmoitus
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {hasUnavailableItems() && (
          <Alert className="mb-6 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Huomio! Jotkin ostoskorisi tuotteet ovat valitettavasti loppuunmyyty.
            </AlertDescription>
          </Alert>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ostoskori on tyhjä</h2>
            <p className="text-muted-foreground mb-6">
              Lisää tuotteita ostoskoriin aloittaaksesi ostokset.
            </p>
            <Button onClick={() => navigate('/saatavilla')}>
              Selaa tuotteita
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item) => {
                const soldOut = isSoldOut(item);
                const availability = getItemAvailability(item.productId);
                
                return (
                  <Card key={item.productId} className={soldOut ? 'opacity-50' : ''}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Fish className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">{item.species}</h3>
                            {soldOut && (
                              <Badge variant="destructive">Loppuunmyyty</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-1">{item.form}</p>
                          <p className="text-sm text-muted-foreground">
                            Kalastaja: {item.fishermanName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.pricePerKg.toFixed(2)} €/kg
                          </p>
                          {availability && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Saatavilla: {availability.currentAvailableQuantity} kg
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <label htmlFor={`quantity-${item.productId}`} className="text-sm font-medium">
                              Määrä:
                            </label>
                            <Input
                              id={`quantity-${item.productId}`}
                              type="number"
                              step="0.1"
                              min="0.1"
                              max={availability?.currentAvailableQuantity || item.availableQuantity}
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.productId, parseFloat(e.target.value) || 0)}
                              className="w-20"
                              disabled={soldOut}
                            />
                            <span className="text-sm text-muted-foreground">kg</span>
                          </div>

                          <div className="text-right min-w-[80px]">
                            <p className="font-semibold">
                              {(item.pricePerKg * item.quantity).toFixed(2)} €
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.productId)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

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
                  {items.map((item) => {
                    const soldOut = isSoldOut(item);
                    return (
                      <div key={item.productId} className={`flex justify-between ${soldOut ? 'line-through opacity-50' : ''}`}>
                        <span>
                          {item.species} ({item.quantity} kg × {item.pricePerKg.toFixed(2)} €/kg)
                        </span>
                        <span>{(item.pricePerKg * item.quantity).toFixed(2)} €</span>
                      </div>
                    );
                  })}
                  <div className="border-t pt-2 mt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Yhteensä</span>
                      <span>
                        {items
                          .filter(item => !isSoldOut(item))
                          .reduce((total, item) => total + (item.pricePerKg * item.quantity), 0)
                          .toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/saatavilla')}
                className="flex-1"
              >
                Jatka ostoksia
              </Button>
              <Button
                onClick={handleGoToCheckout}
                disabled={items.length === 0 || hasUnavailableItems()}
                className="flex-1"
                size="lg"
              >
                Mene kassalle
              </Button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Ostoskori;