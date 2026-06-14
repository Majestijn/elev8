<?php

namespace App\Support;

/**
 * Eén bron van waarheid voor "welke tijdvakken zijn actief", afhankelijk van de
 * feature-flag `booking.calendar_enabled`:
 *  - AAN  → dagdelen met agenda-beschikbaarheid (config 'slots')
 *  - UIT  → vaste starttijden zonder Google (config 'simple_slots')
 */
class BookingSlots
{
    public static function calendarEnabled(): bool
    {
        return (bool) config('booking.calendar_enabled');
    }

    /** @return array<int, array<string, string>> */
    public static function all(): array
    {
        return self::calendarEnabled()
            ? config('booking.slots', [])
            : config('booking.simple_slots', []);
    }

    /** @return array<int, string> */
    public static function keys(): array
    {
        return array_column(self::all(), 'key');
    }
}
