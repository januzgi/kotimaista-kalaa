import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Profiili from "./pages/Profiili";
import Admin from "./pages/Admin";
import Saatavilla from "./pages/Saatavilla";
import Ostoskori from "./pages/Ostoskori";
import Tilaa from "./pages/Tilaa";
import Kiitos from "./pages/Kiitos";
import Toimitusehdot from "./pages/Toimitusehdot";
import NotFound from "./pages/NotFound";
import Tietosuoja from "./pages/Tietosuoja";
import { VaihdaSalasana } from "./pages/VaihdaSalasana";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

/**
 * React Query client instance for managing server state and caching
 */
const queryClient = new QueryClient();

/**
 * Main App component that provides the root routing and global providers for the application.
 *
 * This component sets up the following providers:
 * - QueryClientProvider: For server state management with React Query
 * - TooltipProvider: For tooltip functionality across the app
 * - BrowserRouter: For client-side routing
 *
 * Routes included:
 * - `/` - Homepage with hero section, available fish, and schedule
 * - `/profiili` - User profile management
 * - `/admin` - Admin dashboard for fishermen
 * - `/saatavilla` - Available fish listing page
 * - `/ostoskori` - Shopping cart page
 * - `/tilaa` - Order placement page
 * - `/kiitos` - Thank you page after order
 * - `/toimitusehdot` - Delivery terms page
 * - `/tietosuoja` - Privacy policy
 * - `*` - 404 not found page
 *
 * @returns The main application component with routing and providers
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/profiili" element={<Profiili />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/saatavilla" element={<Saatavilla />} />
            <Route path="/ostoskori" element={<Ostoskori />} />
            <Route path="/tilaa" element={<Tilaa />} />
            <Route path="/kiitos" element={<Kiitos />} />
            <Route path="/toimitusehdot" element={<Toimitusehdot />} />
            <Route path="/tietosuoja" element={<Tietosuoja />} />
            <Route path="/vaihda-salasana" element={<VaihdaSalasana />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
