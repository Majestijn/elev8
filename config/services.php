<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | Google Calendar — read-only beschikbaarheid via een service-account.
    | 'calendar_id'  : de agenda die met het service-account is gedeeld
    |                  (bv. chris@urbanlift.nl of een agenda-ID).
    | 'credentials'  : de service-account-JSON. Mag de ruwe JSON-string zijn
    |                  (handig op Railway als env-var) of een pad naar het
    |                  JSON-bestand. Leeg = check uit → alle slots boekbaar.
    */
    'google' => [
        'calendar_id' => env('GOOGLE_CALENDAR_ID'),
        'credentials' => env('GOOGLE_SERVICE_ACCOUNT_JSON'),
    ],

];
