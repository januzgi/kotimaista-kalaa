import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Profiili from "./pages/Profiili";
import Admin from "./pages/Admin";
import Saatavilla from "./pages/Saatavilla";
import Tilaa from "./pages/Tilaa";
import Kiitos from "./pages/Kiitos";
import Toimitusehdot from "./pages/Toimitusehdot";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/profiili" element={<Profiili />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/saatavilla" element={<Saatavilla />} />
          <Route path="/tilaa" element={<Tilaa />} />
          <Route path="/kiitos" element={<Kiitos />} />
          <Route path="/toimitusehdot" element={<Toimitusehdot />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
