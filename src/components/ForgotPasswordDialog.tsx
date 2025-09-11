import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ForgotPasswordDialog = ({
  open,
  onOpenChange,
}: ForgotPasswordDialogProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handlePasswordReset = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/vaihda-salasana`,
      });
      if (error) throw error;
      setSent(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Virhe",
        description: "Salasanan nollauslinkin lähettäminen epäonnistui.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset component state when dialog is closed
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setTimeout(() => {
        setSent(false);
        setEmail("");
      }, 300);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nollaa salasana</DialogTitle>
        </DialogHeader>
        {sent ? (
          <div className="py-4 text-center space-y-4">
            <p>
              Jos sähköposti löytyy järjestelmästämme, olemme lähettäneet
              sinulle linkin salasanan nollaamista varten.
            </p>
            <Button onClick={() => handleOpenChange(false)} className="w-full">
              Sulje
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Syötä sähköpostiosoitteesi, niin lähetämme sinulle linkin uuden
              salasanan asettamista varten.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Sähköposti</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              onClick={handlePasswordReset}
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? "Lähetetään..." : "Lähetä nollauslinkki"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
