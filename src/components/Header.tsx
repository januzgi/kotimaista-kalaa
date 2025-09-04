import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-primary">
            Kotimaistakalaa
          </h1>
        </div>
        
        <Button variant="outline" className="text-sm">
          Kirjaudu sisään
        </Button>
      </div>
    </header>
  );
};