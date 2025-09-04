import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { AvailableFish } from "@/components/AvailableFish";
import { PublicSchedule } from "@/components/PublicSchedule";
import { Footer } from "@/components/Footer";

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
