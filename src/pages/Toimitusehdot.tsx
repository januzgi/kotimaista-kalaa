import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Terms of service page component displaying delivery and service terms.
 *
 * Features:
 * - Comprehensive terms covering orders, delivery, pricing, and cancellations
 * - Finnish legal terms specific to fish sales and delivery
 * - Structured content with numbered sections
 * - Responsive design with proper typography
 * - Auto-updating last modified date
 *
 * The terms clarify the relationship between customers, fishermen, and
 * the platform, ensuring clear expectations for all parties.
 *
 * @returns The terms of service page component
 */
const Toimitusehdot = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-[var(--content-width)]">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">
            Toimitusehdot
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">
              1. Yleistä
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Nämä toimitusehdot koskevat kaikkia Kotimaista kalaa -palvelun
              kautta tehtyjä tilauksia. Tekemällä tilauksen hyväksyt nämä ehdot
              kokonaisuudessaan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">
              2. Tilauksen tekeminen ja sitovuus
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Tilaus on sitova. Asiakkaalla on kuitenkin oikeus peruuttaa tilaus
              kohdan 5 (Peruutusehdot) mukaisesti. Tilaus vahvistetaan, kun
              kalastaja on hyväksynyt sen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">
              3. Hinnat ja maksu
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Tuotteiden hinnat ovat nähtävillä tuotesivuilla. Kotiinkuljetuksen
              hinta ilmoitetaan tilausta tehdessä. Maksu suoritetaan tilauksen
              noudon tai toimituksen yhteydessä suoraan kalastajalle. Hyväksytyt
              maksutavat ovat käteinen ja mobiilimaksu, ellei toisin sovita.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">
              4. Toimitus ja nouto
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              <strong>Nouto:</strong> Nouto-osoite ilmoitetaan tilausprosessin
              yhteydessä. Mikäli tuotetta ei noudeta 30 minuutin kuluessa
              sovitun noutoajan päättymisestä, kalastajalla on oikeus myydä
              tuote eteenpäin, ja tilaus katsotaan asiakkaan toimesta
              peruuntuneeksi.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Kotiinkuljetus:</strong> Toimitus tapahtuu sovittuna
              aikana asiakkaan antamaan osoitteeseen. Asiakkaan tulee olla
              paikalla vastaanottamassa toimitusta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">
              5. Peruutusehdot
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Tilaus tulee peruuttaa viimeistään 2 tuntia ennen sovitun nouto-
              tai toimitusajan alkua ottamalla yhteyttä suoraan kalastajaan.
              Tämän aikarajan jälkeen tehtyjä peruutuksia ei hyväksytä.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">
              6. Tuotteen laatu ja reklamaatiot
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Kalastaja takaa tuotteen tuoreuden ja laadun luovutushetkellä.
              Mahdolliset tuotteen laatuun liittyvät huomautukset tulee esittää
              välittömästi tuotetta vastaanotettaessa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">
              7. Ylivoimainen este (Force Majeure)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Kalastaja ei vastaa toimituksen viivästymisestä tai
              peruuntumisesta, jos se johtuu ylivoimaisesta esteestä, kuten
              poikkeuksellisista sääolosuhteista tai sairastumisesta.
              Tällaisessa tapauksessa kalastaja on yhteydessä asiakkaaseen
              sopiakseen uudesta toimitusajasta tai tilauksen perumisesta
              veloituksetta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">
              8. Asiakkaan vastuu
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Asiakas vastaa antamiensa yhteystietojen ja toimitusosoitteen
              oikeellisuudesta sekä on velvollinen olemaan tavoitettavissa
              sovittuna toimitus- tai noutoaikana.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">
              9. Palveluntarjoajan rooli
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Kotimaista kalaa -palvelu toimii ainoastaan välittäjänä kalastajan
              ja asiakkaan välillä. Kauppa syntyy suoraan asiakkaan ja
              kalastajan välille.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">
              10. Ehtojen muuttaminen
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Palveluntarjoaja pidättää oikeuden muuttaa näitä toimitusehtoja.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-2">
              11. Yhteystiedot
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Kysymykset ja yhteydenotot tulee ohjata suoraan kalastajalle,
              jonka yhteystiedot löytyvät tilausvahvistuksesta.
            </p>
          </section>

          <div className="text-sm text-muted-foreground mt-8 pt-4 border-t">
            <p>Viimeksi päivitetty: 20.10.2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Toimitusehdot;
