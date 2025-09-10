import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";
import { fishIcons } from "@/assets/icons";

/**
 * Component that displays available fish species with example pricing.
 *
 * Features:
 * - Grid layout of fish products (responsive: 1-3 columns)
 * - Example fish species with starting prices
 * - Call-to-action button linking to full fish listing
 * - Informative description about pricing
 * - Consistent styling with primary colors
 *
 * This component serves as a preview of available fish species on the homepage,
 * encouraging users to explore the full catalog. Prices shown are indicative
 * starting prices and may vary based on preparation method.
 *
 * @returns The available fish showcase component
 */
export const AvailableFish = () => {
  const fishProducts = [
    { fishName: "Ahven", price: "alkaen 15€/kg", fishIcon: fishIcons.ahven },
    { fishName: "Kuha", price: "alkaen 18€/kg", fishIcon: fishIcons.kuha },
    { fishName: "Hauki", price: "alkaen 8€/kg", fishIcon: fishIcons.hauki },
    { fishName: "Siika", price: "alkaen 18€/kg", fishIcon: fishIcons.siika },
    { fishName: "Muikku", price: "alkaen 6€/kg", fishIcon: fishIcons.muikku },
    { fishName: "Taimen", price: "alkaen 20€/kg", fishIcon: fishIcons.taimen },
  ];

  return (
    <section className="py-12 px-4 bg-card">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-primary mb-4">
          Saatavilla olevat kalat
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Alla esimerkkejä kalalajeista ja niiden viitteelliset alkaen-hinnat.
          Todellinen hinta riippuu kalan muodosta (esim. fileoitu).
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
