import { Fish } from "lucide-react";
import { fishIcons } from "@/assets/icons";

// Define the props for our new component
interface FishIconProps {
  species: string;
  className?: string; // Make it customizable with a className prop
}

/**
 * A reusable component that dynamically displays the correct fish icon
 * based on the species name. Falls back to a generic icon if no match is found.
 */
export const FishIcon = ({ species, className }: FishIconProps) => {
  const iconKey = species.toLowerCase() as keyof typeof fishIcons;
  const iconSrc = fishIcons[iconKey];

  if (iconSrc) {
    return (
      <img
        src={iconSrc}
        alt={species}
        className={`${className ? className : "mr-2 h-8 w-8"} object-contain`}
      />
    );
  }

  // Fallback to the generic Lucide Fish icon
  return <Fish className={`${className} text-primary`} />;
};
