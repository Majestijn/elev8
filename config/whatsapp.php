<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Driver
    |--------------------------------------------------------------------------
    | 'callmebot' = simpele WhatsApp-melding zonder Meta (MVP). 'meta' = Meta
    | WhatsApp Cloud API. Iets anders = geen melding.
    */
    'driver' => env('WHATSAPP_DRIVER', 'callmebot'),

    /*
    |--------------------------------------------------------------------------
    | CallMeBot
    |--------------------------------------------------------------------------
    | Ontvangers als "phone:apikey", komma-gescheiden. Elk nummer haalt z'n
    | eigen apikey op door het CallMeBot-nummer te appen (zie setup-instructies).
    | Bv. "31611111111:1234567,31622222222:7654321"
    */
    'callmebot_recipients' => env('CALLMEBOT_RECIPIENTS'),

    /*
    |--------------------------------------------------------------------------
    | Meta WhatsApp Cloud API
    |--------------------------------------------------------------------------
    | Voor de melding aan Chris bij een nieuwe aanvraag. Ontbreekt één van de
    | drie verplichte waarden (token/phone_number_id/to), dan stuurt de notifier
    | niets (no-op) — handig lokaal/zonder credentials.
    |
    | Business-initiated berichten vereisen een GOEDGEKEURDE template. Begin met
    | 'hello_world' (zonder parameters) om de verbinding te testen; zet daarna
    | WHATSAPP_TEMPLATE op je eigen NL-template met 4 body-parameters.
    */
    'token' => env('WHATSAPP_TOKEN'),
    'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
    // Eén of meer ontvangers, komma-gescheiden (bv. "31611111111,31622222222").
    // In Meta dev-modus moet elk nummer als test-recipient geverifieerd zijn.
    'to' => env('WHATSAPP_TO'),
    'template' => env('WHATSAPP_TEMPLATE', 'hello_world'),
    'language' => env('WHATSAPP_LANG', 'en_US'),
    'api_version' => env('WHATSAPP_API_VERSION', 'v21.0'),
];
