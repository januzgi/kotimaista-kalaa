import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmailSubscriptionModal = ({ open, onOpenChange }: EmailSubscriptionModalProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Pre-fill email if user is logged in
  const displayEmail = user?.email || email;
  const isEmailDisabled = !!user?.email;

  const handleSubscribe = async () => {
    const emailToSubscribe = user?.email || email;
    
    if (!emailToSubscribe) {
      toast({
        title: "Virhe",
        description: "Syötä sähköpostiosoite",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('email_subscriptions')
        .insert([{ email: emailToSubscribe }]);

      if (error) {
        console.error('Subscription error:', error);
        toast({
          title: "Virhe",
          description: "Tilauksen lisääminen epäonnistui. Yritä uudelleen.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Kiitos!",
        description: "Saat jatkossa ilmoituksia sähköpostiisi.",
      });
      
      onOpenChange(false);
      setEmail('');
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Virhe",
        description: "Jotain meni pieleen. Yritä uudelleen.",
        variant: "destructive"
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