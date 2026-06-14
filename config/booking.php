<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Tijdzone van de boekingen
    |--------------------------------------------------------------------------
    | De slot-tijden hieronder zijn lokale kloktijden in deze tijdzone. Wordt
    | gebruikt om een dagdeel om te rekenen naar een absoluut tijdvenster voor
    | de Google Calendar-beschikbaarheidscheck.
    */
    'timezone' => env('BOOKING_TIMEZONE', 'Europe/Amsterdam'),

    /*
    |--------------------------------------------------------------------------
    | Google Calendar-beschikbaarheid (feature-flag)
    |--------------------------------------------------------------------------
    | UIT (default): de simpele flow — datum + 4 vaste starttijden, géén Google.
    | AAN: dagdelen met live beschikbaarheid + "betere dag"-suggestie. Zet pas
    | aan als Chris het wil én de GOOGLE_*-vars staan ingevuld.
    */
    'calendar_enabled' => (bool) env('BOOKING_CALENDAR_ENABLED', false),

    /*
    |--------------------------------------------------------------------------
    | Dagdelen — gebruikt wanneer de agenda-flow AAN staat
    |--------------------------------------------------------------------------
    | Elk dagdeel heeft een 'key' (opgeslagen in de boeking), een 'label' (wat
    | de klant ziet) en een venster [start, end). Een agenda-afspraak die dat
    | venster overlapt maakt het dagdeel 'bezet' → rood doorgestreept + niet
    | klikbaar. Pas gerust de tijden aan; de rest van de app volgt automatisch.
    */
    'slots' => [
        ['key' => 'ochtend', 'label' => 'Ochtend', 'start' => '08:00', 'end' => '12:00'],
        ['key' => 'middag', 'label' => 'Middag', 'start' => '12:00', 'end' => '17:00'],
        ['key' => 'avond', 'label' => 'Avond', 'start' => '17:00', 'end' => '21:00'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Vaste starttijden — gebruikt wanneer de agenda-flow UIT staat
    |--------------------------------------------------------------------------
    | De oorspronkelijke simpele keuze: gewoon vier starttijden, zonder enige
    | beschikbaarheidscheck. De klant kiest een voorkeurstijd; Chris stemt af.
    */
    'simple_slots' => [
        ['key' => '08:00', 'label' => '08:00'],
        ['key' => '10:00', 'label' => '10:00'],
        ['key' => '13:00', 'label' => '13:00'],
        ['key' => '15:00', 'label' => '15:00'],
    ],

    /*
    |--------------------------------------------------------------------------
    | "Betere dag"-suggestie
    |--------------------------------------------------------------------------
    | Als op de gekozen dag meer dan de helft van de dagdelen bezet is, kijkt de
    | app 'window_days' dagen terug én vooruit (in één FreeBusy-call) en stelt de
    | dagen met méér vrije dagdelen voor. 'max' = hoeveel suggesties tonen.
    */
    'suggestion' => [
        'window_days' => 3,
        'max' => 2,
    ],
];
