import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { AvailableFish } from "@/components/AvailableFish";
import { PublicSchedule } from "@/components/PublicSchedule";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { EmailSubscriptionModal } from "@/components/EmailSubscriptionModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Homepage component that serves as the landing page for the Kotimaista kalaa application.
 *
 * Layout structure:
 * - Header: Navigation and authentication
 * - HeroSection: Welcome message and call-to-action
 * - AvailableFish: Grid of fish products with prices
 * - PublicSchedule: Fisherman's calendar and notes
 * - Included a CTA before the footer for joining the mailing list
 * - Footer: Site information and credits
 *
 * This page is designed to introduce visitors to the service, showcase
 * available fish products, and provide fisherman schedule information.
 *
 * @returns The homepage component
 */
const Index = () => {
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
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AvailableFish />
        <PublicSchedule />

        {!isSubscribed && (
          <>
            <div className="w-full text-center mb-8 px-4">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-4">
                Älä missaa seuraavaa saalista!
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                Liity postituslistallemme ja saat ensimmäisenä tiedon, kun
                tuoretta kalaa on taas saatavilla.
              </p>
              <Button
                variant="default"
                size="lg"
                className="w-full sm:w-auto max-w-[240px]"
                onClick={() => setIsSubscriptionModalOpen(true)}
                disabled={isSubscribed}
              >
                {isSubscribed ? "Olet jo listalla" : "Liity listalle"}
              </Button>
            </div>

            <EmailSubscriptionModal
              open={isSubscriptionModalOpen}
              onOpenChange={setIsSubscriptionModalOpen}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
