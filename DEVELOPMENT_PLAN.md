# Vertexa Development Plan (MVP)

Dit document beschrijft de technische roadmap en architectuur voor de ontwikkeling van de Vertexa mobiele app, geoptimaliseerd voor snelheid en stabiliteit met Laravel 12 en React Native.

## 1. Technologische Stack
*   **Backend:** Laravel 12 (PHP) - De centrale motor voor business logica, API en admin.
*   **Frontend (Mobiel):** React Native (Expo) - Cross-platform app voor klanten en aanbieders.
*   **Admin Panel:** Filament PHP - Voor een krachtig beheerpaneel (vliegende start).
*   **Database:** PostgreSQL - Robuuste opslag met geo-data ondersteuning.
*   **Real-time:** Laravel Reverb - Voor live status-updates en in-app notificaties.
*   **Authenticatie:** Laravel Sanctum - Veilige token-gebaseerde auth voor de mobiele app.
*   **Betalingen:** Stripe Connect via Laravel Cashier.

---

## 2. Fase 1: Fundament & Onboarding (Weken 1-3)
*   **Backend setup:** Laravel 12 installatie, Sanctum config voor mobiele auth.
*   **Database Design:** Migraties voor `Users`, `Bookings`, `Providers`, en `Equipment`.
*   **Aanbieder Portal (Filament):** Directe interface voor aanbieders om hun profiel en vloot te beheren.
*   **Stripe Connect:** Opzetten van de onboarding flow voor aanbieders (Express accounts).

## 3. Fase 2: De Boekings-Engine & API (Weken 4-7)
*   **API Ontwikkeling:** Endpoints voor postcode-checks, beschikbaarheid en prijsberekening.
*   **Matching Algoritme:** Laravel Service die de meest geschikte aanbieder koppelt aan een boeking.
*   **React Native Integration:** Opzetten van de basis app-structuur, authenticatie-schermen en de eerste zoek-flow.
*   **Betalingen:** Implementatie van PaymentIntents en split-payment logica via Laravel Cashier.

## 4. Fase 3: Operational OS & Real-time (Weken 8-10)
*   **Status Management:** State-machine voor boekingen (`pending`, `confirmed`, `en_route`, `active`, `completed`).
*   **Real-time Updates:** Integratie van Laravel Reverb met de Expo app voor live-tracking van de lift.
*   **In-app Chat:** Lichtgewicht chat-module via WebSockets (Reverb).
*   **Push Notificaties:** Expo Push Notifications integratie via Laravel.

## 5. Fase 4: Admin, Facturatie & Launch (Weken 11-12)
*   **Admin Dashboard (Filament):** Uitgebreide statistieken, incident-management en handmatige overrides voor de platformeigenaar.
*   **Automatisering:** Automatische PDF facturatie voor klant en aanbieder.
*   **Payouts:** Automatische afwikkeling van betalingen na succesvolle afronding van een klus.
*   **Testing & QA:** End-to-end testen van de volledige flow van aanvraag tot uitbetaling.

---

## 6. Ontwikkelingsconventies
*   **Laravel Best Practices:** Gebruik van Service Classes voor business logica en Form Requests voor validatie.
*   **API-First:** Duidelijke scheiding tussen backend en de mobiele frontend.
*   **Atomic Design (React Native):** Component-gebaseerde opbouw van de app voor herbruikbaarheid.
*   **Security:** Rate-limiting op API endpoints en strikte validatie op Stripe webhooks.