import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Privacy policy page component.
 * * Outlines the data handling practices for the Kotimaistakalaa service,
 * in compliance with GDPR.
 * * @returns The privacy policy page component
 */
const Tietosuoja = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-dark">
              Tietosuojaseloste
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">
                1. Rekisterinpitäjä
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Jani Suoranta <br />
                suorantacoding(at)gmail.com
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">
                2. Rekisterin nimi
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Kotimaista kalaa -palvelun asiakas- ja markkinointirekisteri.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">
                3. Henkilötietojen käsittelyn tarkoitus
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Henkilötietoja käsitellään käyttäjätunnistautumista, tilausten
                käsittelyä, toimitusta ja laskutusta varten. Lisäksi
                sähköpostiosoitteita kerätään saalisilmoitusten lähettämistä
                varten niille käyttäjille, jotka ovat tilanneet ilmoitukset.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">
                4. Rekisterin tietosisältö
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Rekisteriin kerätään seuraavia tietoja: <br />
                - Käyttäjän nimi, sähköpostiosoite ja profiilikuvan URL
                (käyttäjän luodessa tilin) <br />- Asiakkaan puhelinnumero ja
                toimitusosoite (tilausta tehdessä) <br />- Sähköpostiosoite
                (saalisilmoitusten tilaajilta)
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">
                5. Säännönmukaiset tietolähteet
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Tiedot kerätään käyttäjiltä itseltään tilin luomisen, profiilin
                muokkaamisen, tilauksen tekemisen ja sähköposti-ilmoitusten
                tilaamisen yhteydessä.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">
                6. Tietojen luovutukset
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Tietoja ei luovuteta säännönmukaisesti kolmansille osapuolille.
                Tietoja ei siirretä EU:n tai Euroopan talousalueen ulkopuolelle.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">
                7. Rekisterin suojauksen periaatteet
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Tiedot tallennetaan suojattuun tietokantaan (Supabase), joka
                sijaitsee valvotussa palvelinkeskuksessa. Palvelu on suojattu
                SSL-salauksella. Pääsy henkilötietoihin on rajattu vain
                rekisterinpitäjälle ja vaatii kirjautumisen. Tietokannassa
                hyödynnetään rivitason suojausta (Row Level Security) pääsyn
                rajaamiseksi entisestään.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">
                8. Tarkastusoikeus ja tiedon korjaaminen
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Jokaisella rekisteröidyllä on oikeus tarkastaa itseään koskevat
                tiedot ja vaatia virheellisen tiedon korjaamista. Käyttäjät
                voivat päivittää omia tietojaan profiilisivun kautta.
              </p>
            </section>

            <div className="text-sm text-muted-foreground mt-8 pt-4 border-t">
              <p>
                Viimeksi päivitetty: {new Date().toLocaleDateString("fi-FI")}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Tietosuoja;
