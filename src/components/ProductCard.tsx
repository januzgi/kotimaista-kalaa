import { Card, CardContent } from "@/components/ui/card";

/**
 * Props for the ProductCard component
 */
interface ProductCardProps {
  /** Name of the fish species */
  fishName: string;
  /** Price information (e.g., "alkaen 15€/kg") */
  price: string;
  /** Emoji icon representing the fish */
  fishIcon: string;
}

/**
 * Product card component for displaying fish information in a grid layout.
 * 
 * Features:
 * - Responsive design that adapts to different screen sizes
 * - Hover effects for better user interaction
 * - Displays fish icon, name, and pricing information
 * - Clickable card with cursor pointer
 * 
 * Used primarily on the homepage and available fish page to showcase
 * different fish species with their starting prices.
 * 
 * @param props - The component props
 * @returns A card component displaying fish product information
 */
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