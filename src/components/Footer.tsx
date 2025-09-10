import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Footer component that appears at the bottom of every page.
 *
 * Features:
 * - Copyright information with current year
 * - Tagline describing the service
 * - Credits with external link to developer's LinkedIn
 * - Consistent styling with primary colors
 * - External link indicator icon
 *
 * The footer maintains brand consistency and provides proper attribution
 * while staying minimal and unobtrusive.
 *
 * @returns The footer component with site information and credits
 */
export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-8 px-4">
      <div className="container mx-auto text-center space-y-3">
        <p className="text-sm">© {new Date().getFullYear()} Kotimaista kalaa</p>
        <p className="text-xs mt-2 opacity-80">
          Tuoretta kalaa suoraan kalastajalta
        </p>

        <div className="text-xs opacity-80 flex justify-center items-center gap-x-4">
          <Link to="/toimitusehdot" className="hover:underline">
            Toimitusehdot
          </Link>
          <span>•</span>
          <Link to="/tietosuoja" className="hover:underline">
            Tietosuojaseloste
          </Link>
        </div>

        <p className="text-xs pt-8 italic" style={{ color: "#ffffff" }}>
          Sivut luonut{" "}
          <a
            href="https://www.linkedin.com/in/janisuoranta/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline inline-flex items-center gap-1"
            style={{ color: "#ffffff" }}
          >
            SuorantaCoding
            <ExternalLink className="h-3 w-3" style={{ color: "#ffffff" }} />
          </a>
        </p>
      </div>
    </footer>
  );
};
