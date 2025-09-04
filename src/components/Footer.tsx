export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-8 px-4">
      <div className="container mx-auto text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} Kotimaistakalaa. Kaikki oikeudet pidätetään.
        </p>
        <p className="text-xs mt-2 opacity-80">
          Tuoretta kalaa suoraan kalastajalta
        </p>
      </div>
    </footer>
  );
};