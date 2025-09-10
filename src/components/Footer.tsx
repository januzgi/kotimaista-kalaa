import { ExternalLink } from 'lucide-react';

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
      <div className="container mx-auto text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} Kotimaistakalaa
        </p>
        <p className="text-xs mt-2 opacity-80">
          Tuoretta kalaa suoraan kalastajalta
        </p>
        <p className="text-xs mt-2" style={{ color: '#ffffff' }}>
          Sivut luonut{' '}
          <a 
            href="https://www.linkedin.com/in/janisuoranta/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline inline-flex items-center gap-1"
            style={{ color: '#ffffff' }}
          >
            SuorantaCoding
            <ExternalLink className="h-3 w-3" style={{ color: '#ffffff' }} />
          </a>
        </p>
      </div>
    </footer>
  );
};