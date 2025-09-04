import { ProductCard } from "./ProductCard";

export const AvailableFish = () => {
  const fishProducts = [
    { fishName: "Ahven", price: "12€/kg", fishIcon: "🐟" },
    { fishName: "Kuha", price: "18€/kg", fishIcon: "🎣" },
    { fishName: "Hauki", price: "14€/kg", fishIcon: "🐠" },
    { fishName: "Siika", price: "16€/kg", fishIcon: "🐟" },
    { fishName: "Muikku", price: "22€/kg", fishIcon: "🐠" },
    { fishName: "Taimen", price: "24€/kg", fishIcon: "🎣" },
  ];

  return (
    <section className="py-12 px-4 bg-card">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center text-primary mb-8">
          Saatavilla olevat kalat
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fishProducts.map((fish, index) => (
            <ProductCard
              key={index}
              fishName={fish.fishName}
              price={fish.price}
              fishIcon={fish.fishIcon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};