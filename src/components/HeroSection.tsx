export const HeroSection = () => {
  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Hero Image Placeholder */}
          <div className="w-full lg:w-1/2">
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">🎣</div>
                <p className="text-sm">Kalastajan kuva</p>
              </div>
            </div>
          </div>
          
          {/* Hero Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
              Tervetuloa Niilan kalastuspaikalle
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Tuoretta, paikallista kalaa suoraan kalastajalta. 
              Pyydän kalaa päivittäin Suomen puhtaista vesistöistä 
              ja toimitan sen tuoreena kotiovellesi.
            </p>
            <p className="text-muted-foreground">
              Yli 20 vuoden kokemus kalastuksesta ja 
              sitoutuminen laadukkaimpaan tuoreeseen kalaan.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};