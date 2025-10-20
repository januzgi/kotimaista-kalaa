import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { fishIcons } from "@/assets/icons";

/**
 * 404 Not Found page component for handling invalid routes.
 *
 * Features:
 * - Error logging for invalid route attempts
 * - User-friendly 404 message
 * - Link back to homepage
 * - Simple centered layout
 *
 * @returns The 404 not found page component
 */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const fishesToShow = [
    { fishName: "Ahven", fishIcon: fishIcons.ahven },
    { fishName: "Kuha", fishIcon: fishIcons.kuha },
    { fishName: "Hauki", fishIcon: fishIcons.hauki },
    { fishName: "Lohi", fishIcon: fishIcons.lohi },
    { fishName: "Siika", fishIcon: fishIcons.siika },
    { fishName: "Muikku", fishIcon: fishIcons.muikku },
    { fishName: "Taimen", fishIcon: fishIcons.taimen },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center mt-8">
      <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
      <p className="text-xl text-muted-foreground mb-4">
        Hupsista! Sivua ei löytynyt. Tarkista osoite.
      </p>
      <a href="/" className="text-secondary underline">
        Palaa etusivulle
      </a>
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 mx-2">
        {fishesToShow.map((fish) => (
          <img
            src={fish.fishIcon}
            alt={fish.fishName}
            className="block w-16 h-16 mx-auto mb-2 sm:mb-3 object-contain"
          />
        ))}
      </div>
    </div>
  );
};

export default NotFound;
