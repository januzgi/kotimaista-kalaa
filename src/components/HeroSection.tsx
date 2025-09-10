import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmailSubscriptionModal } from "@/components/EmailSubscriptionModal";
import heroImage from "@/assets/images/Rubai.jpg";

/**
 * Hero section component for the homepage.
 *
 * Features:
 * - Welcoming message with fisherman introduction
 * - Call-to-action buttons for browsing fish and subscribing
 * - Placeholder for fisherman's photo
 * - Responsive layout (stacked on mobile, side-by-side on desktop)
 * - Integration with email subscription modal
 * - Professional and personal messaging
 *
 * This component serves as the main landing area that introduces visitors
 * to the fisherman (Niila) and encourages them to explore products or
 * subscribe for notifications.
 *
 * @returns The hero section component
 */
export const HeroSection = () => {
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  return (
    <section className="py-8 sm:py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
          {/* Hero Image Placeholder */}
          <div className="w-full lg:w-1/2">
            <div className="bg-muted rounded-lg flex items-center justify-center max-h-[400px] overflow-hidden">
              <img
                src={heroImage}
                alt={"Maisemaa"}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Hero Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-4">
              Tervetuloa Niilan kalastuspaikalle
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6">
              Tuoretta, paikallista kalaa suoraan kalastajalta. Pyydän kalaa
              päivittäin Suomen puhtaista vesistöistä ja toimitan sen tuoreena
              kotiovellesi.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Yli 20 vuoden kokemus kalastuksesta ja sitoutuminen laadukkaimpaan
              tuoreeseen kalaan.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 lg:justify-start justify-center">
              <Link to="/saatavilla">
                <Button size="lg" className="w-full sm:w-auto">
                  Selaa saatavaa kalaa
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => setIsSubscriptionModalOpen(true)}
              >
                Tilaa sähköposti-ilmoitukset
              </Button>
            </div>
          </div>
        </div>
      </div>

      <EmailSubscriptionModal
        open={isSubscriptionModalOpen}
        onOpenChange={setIsSubscriptionModalOpen}
      />
    </section>
  );
};
