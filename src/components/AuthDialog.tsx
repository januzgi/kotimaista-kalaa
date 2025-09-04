import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const { signInWithProvider, signInWithEmail, signUpWithEmail } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleProviderSignIn = async (provider: 'google') => {
    await signInWithProvider(provider);
    onOpenChange(false);
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) return;
    
    setIsLoading(true);
    try {
      await signInWithEmail(loginEmail, loginPassword);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the auth function
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupEmail || !signupPassword || !confirmPassword) return;
    
    if (signupPassword !== confirmPassword) {
      // This should be handled with a toast or error state
      return;
    }
    
    setIsLoading(true);
    try {
      await signUpWithEmail(signupEmail, signupPassword);
      setSignupSuccess(true);
    } catch (error) {
      // Error handling is done in the auth function
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Tervetuloa</DialogTitle>
        </DialogHeader>
        
        {signupSuccess ? (
          <div className="space-y-4 py-4 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-primary">Kiitos!</h3>
              <p className="text-muted-foreground">
                Vahvista sähköpostiosoitteesi klikkaamalla sinulle lähetettyä linkkiä.
              </p>
            </div>
            <Button 
              onClick={() => {
                setSignupSuccess(false);
                onOpenChange(false);
              }}
              className="w-full"
            >
              Sulje
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">
                <LogIn className="mr-2 h-4 w-4" />
                Kirjaudu sisään
              </TabsTrigger>
              <TabsTrigger value="signup">
                <UserPlus className="mr-2 h-4 w-4" />
                Luo tili
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-4">
              {/* Login Form */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Sähköposti</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="anna@example.com"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Salasana</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="********"
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  onClick={handleLogin}
                  className="w-full"
                  disabled={isLoading || !loginEmail || !loginPassword}
                >
                  {isLoading ? "Käsitellään..." : "Kirjaudu sisään"}
                </Button>
              </div>

              {/* Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">TAI</span>
                </div>
              </div>

              {/* Google Login */}
              <Button 
                onClick={() => handleProviderSignIn('google')}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Jatka Googlella
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              {/* Signup Form */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Sähköposti</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="anna@example.com"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Salasana</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="********"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Vahvista salasana</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="********"
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  onClick={handleSignup}
                  className="w-full"
                  disabled={isLoading || !signupEmail || !signupPassword || !confirmPassword || signupPassword !== confirmPassword}
                >
                  {isLoading ? "Käsitellään..." : "Luo tili"}
                </Button>
                {signupPassword !== confirmPassword && confirmPassword && (
                  <p className="text-sm text-destructive">Salasanat eivät täsmää</p>
                )}
              </div>

              {/* Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">TAI</span>
                </div>
              </div>

              {/* Google Login */}
              <Button 
                onClick={() => handleProviderSignIn('google')}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Jatka Googlella
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};