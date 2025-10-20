import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Home, Fish } from "lucide-react";

/**
 * Thank you page component displayed after successful order submission.
 *
 * Features:
 * - Success confirmation with visual checkmark
 * - Clear explanation of next steps in the order process
 * - Navigation options back to homepage or product browsing
 * - Professional and reassuring messaging
 * - Responsive design
 *
 * This page provides closure to the order process and sets proper
 * expectations about order confirmation and fulfillment timing.
 *
 * @returns The thank you page component
 */
const Kiitos = () => {
  const navigate = useNavigate();

  return (
    <div className="container px-4 py-8 max-w-2xl mx-auto">
      <Card className="text-center">
        <CardHeader className="pb-6">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">
            Kiitos tilauksestasi!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">
              Tilauksesi on vastaanotettu ja odottaa kalastajan vahvistusta.
            </p>
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Mitä tapahtuu seuraavaksi?</h3>
              <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                <li>• Kalastaja tarkistaa tilauksesi ja vahvistaa sen</li>
                <li>
                  • Saat vahvistuksen sähköpostitse lopullisilla tiedoilla
                </li>
                <li>• Voit noutaa tai vastaanottaa kalasi sovittuna aikana</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              Jos sinulla on kysymyksiä tilauksestasi, ota yhteyttä suoraan
              kalastajaan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/")}
              variant="default"
              className="flex items-center"
            >
              <Home className="h-4 w-4" />
              Takaisin etusivulle
            </Button>
            <Button
              onClick={() => navigate("/saatavilla")}
              variant="outline"
              className="flex items-center"
            >
              <Fish className="h-4 w-4" />
              Selaa muita kaloja
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Kiitos;
