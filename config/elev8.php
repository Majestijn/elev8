<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Inbox-wachtwoord
    |--------------------------------------------------------------------------
    | Demo-/MVP-gate voor Chris' aanvragen-inbox op /elev8. Vervang dit in een
    | latere sprint door echte authenticatie (Laravel auth + users-tabel).
    */
    'password' => env('ELEV8_PASSWORD', 'elev8'),

    /*
    |--------------------------------------------------------------------------
    | Foto-opslag
    |--------------------------------------------------------------------------
    | Filesystem-disk waarop situatiefoto's worden bewaard. Lokaal: 'public'
    | (storage/app/public, via `php artisan storage:link` webtoegankelijk).
    | Op Railway: zet ELEV8_PHOTO_DISK op een S3/bucket-disk — geen codewijziging.
    */
    'photo_disk' => env('ELEV8_PHOTO_DISK', 'public'),
];
