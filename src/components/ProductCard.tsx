import { Card, CardContent } from "@/components/ui/card";

interface ProductCardProps {
  fishName: string;
  price: string;
  fishIcon: string;
}

export const ProductCard = ({ fishName, price, fishIcon }: ProductCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6 text-center">
        <div className="text-4xl mb-4">{fishIcon}</div>
        <h3 className="font-semibold text-lg mb-2 text-foreground">{fishName}</h3>
        <p className="text-secondary font-bold text-xl">{price}</p>
      </CardContent>
    </Card>
  );
};