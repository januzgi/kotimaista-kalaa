import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  species: string;
  form: string;
  price_per_kg: number;
  available_quantity: number;
  catch_date: string;
  created_at: string;
}

interface InventoryListProps {
  fishermanProfileId: string;
  refreshKey: number;
}

export const InventoryList = ({ fishermanProfileId, refreshKey }: InventoryListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('fisherman_id', fishermanProfileId)
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

    fetchProducts();
  }, [fishermanProfileId, refreshKey, toast]);

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
        <CardTitle>Nykyinen varasto ({products.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Ei tuotteita varastossa. Lisää ensimmäinen saalisi yllä olevalla lomakkeella.
          </p>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{product.species}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="secondary">{product.form}</Badge>
                      <Badge variant="outline">
                        {product.available_quantity} kg
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      {product.price_per_kg.toFixed(2)} €/kg
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pyydetty: {format(new Date(product.catch_date), 'dd.MM.yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};