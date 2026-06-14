<?php

namespace App\Services\Calendar;

use Illuminate\Support\Carbon;

/**
 * Levert de 'bezet'-blokken uit een externe agenda voor een tijdvenster.
 * Implementaties zijn faalveilig: bij ontbrekende config of een fout geven
 * ze een lege lijst terug (→ alles boekbaar), nooit een exception.
 */
interface CalendarAvailability
{
    /**
     * @return array<int, array{start: Carbon, end: Carbon}> bezet-intervallen
     *         die [$from, $to] overlappen.
     */
    public function busyPeriods(Carbon $from, Carbon $to): array;
}
