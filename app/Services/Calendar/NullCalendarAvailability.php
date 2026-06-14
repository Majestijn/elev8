<?php

namespace App\Services\Calendar;

use Illuminate\Support\Carbon;

/**
 * Fallback wanneer er geen Google Calendar is geconfigureerd: nooit iets
 * bezet → alle tijdvakken blijven boekbaar.
 */
class NullCalendarAvailability implements CalendarAvailability
{
    public function busyPeriods(Carbon $from, Carbon $to): array
    {
        return [];
    }
}
