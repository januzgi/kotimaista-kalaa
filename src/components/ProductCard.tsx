import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
  fishName: string;
  price: string;
  fishIcon: string;
}

export const ProductCard = ({ fishName, price, fishIcon }: ProductCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-3 sm:p-4 text-center">
        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{fishIcon}</div>
        <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 text-foreground">{fishName}</h3>
        <p className="text-secondary font-bold text-sm sm:text-base">{price}</p>
      </CardContent>
    </Card>
  );
};