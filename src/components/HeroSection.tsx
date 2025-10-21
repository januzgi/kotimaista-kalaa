import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmailSubscriptionModal } from "@/components/EmailSubscriptionModal";
import heroImage from "@/assets/images/Rubai.jpg";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BellRing } from "lucide-react";

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
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (user?.email) {
        const { data, error } = await supabase
          .from("email_subscriptions")
          .select("email")
          .eq("email", user.email)
          .maybeSingle();

        if (error) {
          console.error("Error checking subscription status:", error);
          return;
        }

        if (data) {
          setIsSubscribed(true);
        }
      }
    };

    checkSubscription();
  }, [user]);

  return (
    <section className="py-8 sm:py-12 px-4">
      <div className="sm:container px-0 mx-auto max-w-4xl">
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
              Tervetuloa apajille
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6">
              Tuoretta, paikallista kalaa suoraan kalastajalta. Pyydän kalaa
              viikoittain Pirkanmaan puhtaista vesistöistä ja toimitan sen
              tuoreena kotiovellesi.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Yli 10 vuoden kokemus kalastuksesta ja sitoutuminen laadukkaimpaan
              tuoreeseen kalaan.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 lg:justify-start justify-center">
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
                disabled={isSubscribed}
              >
                {isSubscribed ? (
                  "Olet jo listalla"
                ) : (
                  <>
                    <BellRing className="h-4 w-4" />
                    Tilaa sähköposti-ilmoitukset
                  </>
                )}
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
