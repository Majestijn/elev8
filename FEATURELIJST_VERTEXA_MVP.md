# Vertexa MVP - Gedetailleerde Featurelijst

Dit document geeft een overzicht van de functionele scope van de Vertexa MVP. De focus ligt op een stabiele, professionele uitvoering van de kernprocessen: boeken, matchen, uitvoeren en betalen.

## 1. Klant-app (React Native / Expo)
De interface voor de eindgebruiker (particulier of zakelijk) om snel en betrouwbaar verticale toegang te regelen.

*   **Direct Boeken:** Zoek-flow op basis van postcode, datum en tijdvak. Geen offertes, maar directe bevestiging.
*   **Transparante Prijsberekening:** Directe berekening van de totaalprijs inclusief eventuele toeslagen.
*   **Betalingsintegratie:** Veilig betalen via iDEAL of creditcard (Stripe).
*   **Real-time Tracking:** Live status-updates van de gereserveerde lift (Status: Gepland -> Onderweg -> Gearriveerd -> Bezig -> Afgerond).
*   **Boekingshistorie:** Overzicht van actuele en voltooide boekingen inclusief downloadbare facturen.
*   **In-app Communicatie:** Directe chatfunctie met de aanbieder gekoppeld aan de specifieke boeking.

## 2. Aanbieder-interface (App & Portal)
Tools voor de liftbedrijven om hun operatie efficiënt te beheren via het platform.

*   **Onboarding & Compliance:** Digitale aanlevering van KvK-gegevens, verzekeringspapieren en bedrijfsinformatie.
*   **Vlootbeheer:** Toevoegen en configureren van specifieke liften met hun unieke specificaties en prijzen.
*   **Agenda & Planning:** Weekoverzicht van alle toegewezen klussen met automatische blokkering van tijdvakken.
*   **Operationele Knoppen:** Eenvoudige interface voor de operator op locatie om de status van de klus te wijzigen (bijv. "Check-in" bij aankomst).
*   **Financieel Dashboard:** Real-time inzicht in verdiende omzet, uitbetaalde bedragen en openstaande posten (via Stripe Express).

## 3. Centraal Beheerpaneel (Filament Admin)
Het "Command Center" voor de platformeigenaar om de regie te voeren.

*   **Gebruikersbeheer:** Goedkeuren en blokkeren van aanbieders en klanten.
*   **Boekingsmonitor:** Overzicht van alle actieve boekingen in Nederland met de mogelijkheid om in te grijpen bij incidenten.
*   **Matching Logica:** Configuratie van de algoritmes die bepalen welke aanbieder aan welke klant wordt gekoppeld.
*   **Financiële Controle:** Monitoring van de split-payments en handmatige trigger voor payouts indien nodig.
*   **Logging & Audit Trail:** Volledige geschiedenis van alle acties en statuswijzigingen binnen het platform voor maximale transparantie.

## 4. Geautomatiseerde Processen (Backend)
De motor onder de motorkap (Laravel 12).

*   **Smart Matching:** Automatische koppeling op basis van beschikbaarheid, locatie en benodigd materieel.
*   **Facturatie Engine:** Automatische generatie van PDF-facturen voor zowel de klant (factuur) als de aanbieder (credit-factuur).
*   **Notificatie Engine:** Geautomatiseerde push-berichten en e-mails bij elke stap in het proces.
*   **Webhook Integratie:** Real-time verwerking van betalingsbevestigingen vanuit Stripe.
