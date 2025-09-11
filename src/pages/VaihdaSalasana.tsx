import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const VaihdaSalasana = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // This effect handles the session update when the user lands on the page
  // from the email link. The token is in the URL fragment.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // This event fires when the user is ready to set a new password.
        // You can add logic here if needed, but often the form is enough.
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSetNewPassword = async () => {
    if (password !== confirmPassword) {
      setError("Salasanat eivät täsmää.");
      return;
    }
    if (password.length < 6) {
      setError("Salasanan tulee olla vähintään 8 merkkiä pitkä.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({
        title: "Onnistui!",
        description: "Salasanasi on päivitetty. Tervetuloa takaisin!",
      });
      navigate("/"); // Redirect to home to login
    } catch (err) {
      setError(
        "Salasanan päivittäminen epäonnistui. Linkki on saattanut vanhentua."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Aseta uusi salasana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Uusi salasana</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Vahvista uusi salasana</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={handleSetNewPassword}
              disabled={loading || !password || !confirmPassword}
              className="w-full"
            >
              {loading ? "Päivitetään..." : "Päivitä salasana"}
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};
