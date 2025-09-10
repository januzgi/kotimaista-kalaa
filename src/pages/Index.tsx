import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { AvailableFish } from "@/components/AvailableFish";
import { PublicSchedule } from "@/components/PublicSchedule";
import { Footer } from "@/components/Footer";

/**
 * Homepage component that serves as the landing page for the Kotimaistakalaa application.
 * 
 * Layout structure:
 * - Header: Navigation and authentication
 * - HeroSection: Welcome message and call-to-action
 * - AvailableFish: Grid of fish products with prices
 * - PublicSchedule: Fisherman's calendar and notes
 * - Footer: Site information and credits
 * 
 * This page is designed to introduce visitors to the service, showcase
 * available fish products, and provide fisherman schedule information.
 * 
 * @returns The homepage component
 */
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AvailableFish />
        <PublicSchedule />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
