import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Toimitusehdot = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-dark">
              Toimitusehdot
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">1. Yleiset ehdot</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nämä toimitusehdot koskevat kaikkia Kotimaistakalaa-palvelun kautta tehtyjä tilauksia. 
                Tekemällä tilauksen hyväksyt nämä ehdot kokonaisuudessaan.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">2. Tilauksen sitovuus</h2>
              <p className="text-muted-foreground leading-relaxed">
                Tilaus on sitova kun se on vahvistettu. Kalastaja vahvistaa tilauksen saatuaan tilausilmoituksen. 
                Vahvistamisen jälkeen tilausta ei voi peruuttaa ilman kalastajan suostumusta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">3. Maksu</h2>
              <p className="text-muted-foreground leading-relaxed">
                Maksu tapahtuu tilauksen noudossa tai toimituksessa suoraan kalastajalle. 
                Hyväksyttyjä maksutapoja ovat käteinen ja mobiilimaksu, ellei toisin sovita.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">4. Toimitus ja nouto</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Nouto:</strong> Tuote noudetaan sovitusta osoitteesta sovittuna aikana. 
                Noutamatta jääneet tuotteet voidaan myydä eteenpäin 30 minuuttia sovitun ajan jälkeen.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong>Kotiinkuljetus:</strong> Toimitusmaksu määräytyy kalastajan hinnaston mukaan. 
                Toimitus tapahtuu sovittuna aikana annettuun osoitteeseen. Vastaanottajan tulee olla paikalla.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">5. Tuotteen laatu ja tuoreus</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kalastaja takaa tuotteen tuoreuden ja laadun toimitushetkellä. 
                Mahdolliset laatuun liittyvät huomautukset tulee esittää heti toimituksen yhteydessä.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">6. Peruutukset ja muutokset</h2>
              <p className="text-muted-foreground leading-relaxed">
                Peruutukset ja muutokset tulee tehdä viimeistään 2 tuntia ennen sovittua nouto- tai toimitusaikaa. 
                Peruutukset tehdään ottamalla yhteyttä suoraan kalastajaan.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">7. Vastuunrajoitukset</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kotimaistakalaa-palvelu toimii välittäjänä kalastajan ja asiakkaan välillä. 
                Kauppa syntyy suoraan asiakkaan ja kalastajan välille. Palveluntarjoaja ei vastaa 
                tuotteen laadusta, toimituksesta tai muista kauppaan liittyvistä seikoista.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-dark mb-3">8. Yhteystiedot</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kysymykset ja yhteydenotot tulee ohjata suoraan kalastajalle, jonka yhteystiedot 
                löytyvät tilausvahvistuksesta.
              </p>
            </section>

            <div className="text-sm text-muted-foreground mt-8 pt-4 border-t">
              <p>Viimeksi päivitetty: {new Date().toLocaleDateString('fi-FI')}</p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Toimitusehdot;