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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Props for the EmailSubscriptionModal component
 */
interface EmailSubscriptionModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback function called when modal open state changes */
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal component for email subscription to new catch notifications.
 *
 * Features:
 * - Auto-fills email if user is logged in
 * - Calls subscribe-and-welcome Edge Function for subscription
 * - Sends welcome email with delivery instructions
 * - Loading states and error handling
 * - Form validation for email input
 * - Success feedback and modal auto-close
 *
 * The modal integrates with the authentication system to streamline
 * the subscription process for logged-in users.
 *
 * @param props - The component props
 * @returns The email subscription modal component
 */
export const EmailSubscriptionModal = ({
  open,
  onOpenChange,
}: EmailSubscriptionModalProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  /**
   * Determines which email to display in the input field
   * Pre-fills with user's email if logged in, otherwise uses local state
   */
  const displayEmail = user?.email || email;
  const isEmailDisabled = !!user?.email;

  /**
   * Handles the subscription process by calling the Edge Function
   */
  const handleSubscribe = async () => {
    const emailToSubscribe = user?.email || email;

    if (!emailToSubscribe) {
      toast({
        title: "Virhe",
        description: "Syötä sähköpostiosoite",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "subscribe-and-welcome",
        {
          body: { email: emailToSubscribe },
        }
      );

      if (error) {
        console.error("Subscription error:", error);
        toast({
          title: "Virhe",
          description: "Tilauksen lisääminen epäonnistui. Yritä uudelleen.",
          variant: "destructive",
        });
        return;
      }

      if (data.message === "Already subscribed") {
        toast({
          title: "Olet jo listalla!",
          description:
            "Kiitos mielenkiinnostasi, olet jo postituslistallamme :')",
        });
      } else {
        toast({
          title: "Kiitos!",
          description:
            "Saat jatkossa ilmoituksia sähköpostiisi. Tarkista myös roskaposti!",
        });
      }

      onOpenChange(false);
      setEmail("");
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Virhe",
        description: "Jotain meni pieleen. Yritä uudelleen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Liity sähköpostilistalle
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-center text-muted-foreground text-sm">
            Saat ilmoituksen aina kun tuoretta kalaa on saatavilla.
          </p>
          <div className="space-y-2">
            <Label htmlFor="email">Sähköpostiosoite</Label>
            <Input
              id="email"
              type="email"
              value={displayEmail}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isEmailDisabled}
              placeholder="anna@example.com"
            />
          </div>
          <Button
            onClick={handleSubscribe}
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? "Lisätään..." : "Liity listalle"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
