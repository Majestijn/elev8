<?php

return [
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
    'to' => env('WHATSAPP_TO'),
    'template' => env('WHATSAPP_TEMPLATE', 'hello_world'),
    'language' => env('WHATSAPP_LANG', 'en_US'),
    'api_version' => env('WHATSAPP_API_VERSION', 'v21.0'),
];
