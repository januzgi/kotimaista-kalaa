import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
  fishName: string;
  price: string;
  fishIcon: string;
}

export const ProductCard = ({ fishName, price, fishIcon }: ProductCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-4 sm:p-6 text-center">
        <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{fishIcon}</div>
        <h3 className="font-semibold text-base sm:text-lg mb-2 text-foreground">{fishName}</h3>
        <p className="text-secondary font-bold text-lg sm:text-xl">{price}</p>
      </CardContent>
    </Card>
  );
};