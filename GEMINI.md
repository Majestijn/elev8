# GEMINI.md - Vertexa Project Context

## Project Overview
**Vertexa** is an upcoming SaaS platform described as the "Operational OS for Vertical Access." Het digitaliseert de markt voor verticaal transport (verhuisliften) via een platform dat volledige operationele controle en zekerheid biedt aan zowel klanten als aanbieders.

## Huidige Status
De definitieve technologische keuzes zijn gemaakt en de offerfase is afgerond. Het project staat op het punt om de realisatiefase in te gaan.
*   **Architectuur:** Laravel 12 (Backend) + React Native/Expo (Mobiel).
*   **Offerte:** € 25.000,- (na korting) voor 348 uur werk.
*   **Documentatie:** Development plan en featurelijst zijn definitief.

## Historie (Sessie 12 feb 2026)
*   **Analyse:** Projectdocumentatie geanalyseerd en initiële context vastgelegd.
*   **Architectuurkeuze:** Besloten om Laravel 12 te gebruiken als backend (i.v.m. ervaring en features zoals Filament/Reverb) en React Native met Expo voor de mobiele app. Bun/Node zijn overwogen maar afgewezen ten gunste van de stabiliteit van Laravel.
*   **Planning:** `DEVELOPMENT_PLAN.md` opgesteld met 4 fasen (Fundament, Boekings-engine, Real-time, Admin/Launch).
*   **Sales Materialen:** 
    *   Offerte gegenereerd (`OFFERTE_VERTEXA.docx`) met een totaal van € 25.000,- incl. projectkorting.
    *   Uitgebreide featurelijst opgesteld (`FEATURELIJST_VERTEXA_MVP.docx`).
    *   Content voor Rompslomp (titel, omschrijving, betalingsvoorwaarden) geleverd.

## Technologische Stack (Definitief)
*   **Backend:** Laravel 12 (Sanctum, Reverb, Filament, Cashier).
*   **Mobiel:** React Native (Expo).
*   **Database:** PostgreSQL.
*   **Payments:** Stripe Connect.

## Belangrijke Bestanden
*   **`DEVELOPMENT_PLAN.md`**: De technische roadmap.
*   **`FEATURELIJST_VERTEXA_MVP.docx`**: Detailoverzicht van de MVP functies.
*   **`OFFERTE_VERTEXA.docx`**: De commerciële afspraak.

## Usage
Gebruik dit bestand als startpunt voor elke nieuwe sessie om de context en gemaakte beslissingen te bewaken.