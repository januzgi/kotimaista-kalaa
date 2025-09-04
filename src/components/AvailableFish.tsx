import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProductCard } from "./ProductCard";

export const AvailableFish = () => {
  const fishProducts = [
    { fishName: "Ahven", price: "alkaen 15€/kg", fishIcon: "🐟" },
    { fishName: "Kuha", price: "alkaen 18€/kg", fishIcon: "🎣" },
    { fishName: "Hauki", price: "alkaen 8€/kg", fishIcon: "🐠" },
    { fishName: "Siika", price: "alkaen 18€/kg", fishIcon: "🐟" },
    { fishName: "Muikku", price: "alkaen 6€/kg", fishIcon: "🐠" },
    { fishName: "Taimen", price: "alkaen 20€/kg", fishIcon: "🎣" },
  ];

  return (
    <section className="py-12 px-4 bg-card">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-primary mb-4">
          Saatavilla olevat kalat
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Alla esimerkkejä kalalajeista ja niiden viitteelliset alkaen-hinnat. Todellinen hinta riippuu kalan muodosta (esim. fileoitu).
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {fishProducts.map((fish, index) => (
            <ProductCard
              key={index}
              fishName={fish.fishName}
              price={fish.price}
              fishIcon={fish.fishIcon}
            />
          ))}
        </div>

        <div className="text-center">
          <Link to="/saatavilla">
            <Button size="lg" className="w-full sm:w-auto">
              Katso kaikki saatavilla olevat kalat
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};