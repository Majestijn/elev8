<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Inbox-wachtwoord
    |--------------------------------------------------------------------------
    | Demo-/MVP-gate voor Chris' aanvragen-inbox op /beheer. Vervang dit in een
    | latere sprint door echte authenticatie (Laravel auth + users-tabel).
    */
    'password' => env('INBOX_PASSWORD', 'urbanlift'),

    /*
    |--------------------------------------------------------------------------
    | Foto-opslag
    |--------------------------------------------------------------------------
    | Filesystem-disk waarop situatiefoto's worden bewaard. Lokaal: 'public'
    | (storage/app/public, via `php artisan storage:link` webtoegankelijk).
    | Op Railway: zet INBOX_PHOTO_DISK op een S3/bucket-disk — geen codewijziging.
    */
    'photo_disk' => env('INBOX_PHOTO_DISK', 'public'),
];
