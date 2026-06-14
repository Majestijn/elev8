<?php

namespace App\Services\Calendar;

use Illuminate\Support\Carbon;

/**
 * Rekent de dagdelen uit `config('booking.slots')` om naar beschikbaarheid,
 * op basis van de bezet-blokken uit de agenda. Levert ook een "betere dag"-
 * suggestie wanneer de gekozen dag grotendeels vol zit.
 */
class SlotAvailability
{
    public function __construct(private readonly CalendarAvailability $calendar) {}

    /**
     * Beschikbaarheid per dagdeel voor één dag (gebruikt door de boeking-guard).
     *
     * @return array<string, bool>
     */
    public function forDate(string $date): array
    {
        $timezone = config('booking.timezone');
        $slots = config('booking.slots', []);

        if ($slots === []) {
            return [];
        }

        $dayStart = Carbon::parse("{$date} {$slots[0]['start']}", $timezone);
        $dayEnd = Carbon::parse("{$date} {$slots[count($slots) - 1]['end']}", $timezone);
        $busy = $this->calendar->busyPeriods($dayStart, $dayEnd);

        return $this->slotsForDay($date, $busy, $timezone);
    }

    /**
     * Beschikbaarheid voor de klantflow: per dagdeel + (indien de dag grotendeels
     * vol zit) suggesties voor nabije dagen met méér vrije dagdelen.
     *
     * @return array{available: array<string,bool>, suggestions: array<int, array{date:string, free:int}>}
     */
    public function overview(string $date): array
    {
        $timezone = config('booking.timezone');
        $slots = config('booking.slots', []);

        if ($slots === []) {
            return ['available' => [], 'suggestions' => []];
        }

        $window = (int) config('booking.suggestion.window_days', 3);
        $today = Carbon::today($timezone);
        $selected = Carbon::parse($date, $timezone)->startOfDay();

        // Bereik clampen op vandaag (nooit dagen in het verleden voorstellen).
        $rangeStart = $selected->copy()->subDays($window)->max($today);
        $rangeEnd = $selected->copy()->addDays($window);

        // Eén FreeBusy-call over het hele bereik; daarna lokaal per dag rekenen.
        $busy = $this->calendar->busyPeriods(
            $rangeStart->copy()->startOfDay(),
            $rangeEnd->copy()->endOfDay(),
        );

        $available = $this->slotsForDay($date, $busy, $timezone);
        $selectedFree = count(array_filter($available));

        return [
            'available' => $available,
            'suggestions' => $this->suggestions(
                $date, $selectedFree, $rangeStart, $rangeEnd, $busy, $timezone, count($slots)
            ),
        ];
    }

    /**
     * @param  array<int, array{start: Carbon, end: Carbon}>  $busy
     * @return array<int, array{date:string, free:int}>
     */
    private function suggestions(
        string $date,
        int $selectedFree,
        Carbon $rangeStart,
        Carbon $rangeEnd,
        array $busy,
        string $timezone,
        int $slotCount,
    ): array {
        // Alleen voorstellen als meer dan de helft van de dagdelen bezet is.
        if ($selectedFree > intdiv($slotCount, 2)) {
            return [];
        }

        $selected = Carbon::parse($date, $timezone)->startOfDay();
        $candidates = [];

        for ($day = $rangeStart->copy(); $day->lte($rangeEnd); $day->addDay()) {
            $ds = $day->toDateString();
            if ($ds === $date) {
                continue;
            }

            $free = count(array_filter($this->slotsForDay($ds, $busy, $timezone)));
            if ($free > $selectedFree) {
                $candidates[] = [
                    'date' => $ds,
                    'free' => $free,
                    'distance' => (int) abs($selected->diffInDays($day)),
                ];
            }
        }

        // Beste eerst: meeste vrije dagdelen, bij gelijkspel het dichtstbij.
        usort($candidates, fn ($a, $b) => $b['free'] <=> $a['free'] ?: $a['distance'] <=> $b['distance']);

        return array_map(
            fn (array $c) => ['date' => $c['date'], 'free' => $c['free']],
            array_slice($candidates, 0, (int) config('booking.suggestion.max', 2)),
        );
    }

    /**
     * Per-dagdeel beschikbaarheid voor één dag tegen een gegeven bezet-lijst.
     * Verstreken dagdelen (op de dag zelf) tellen als niet-boekbaar.
     *
     * @param  array<int, array{start: Carbon, end: Carbon}>  $busy
     * @return array<string, bool>
     */
    private function slotsForDay(string $date, array $busy, string $timezone): array
    {
        $now = Carbon::now($timezone);
        $available = [];

        foreach (config('booking.slots', []) as $slot) {
            $start = Carbon::parse("{$date} {$slot['start']}", $timezone);
            $end = Carbon::parse("{$date} {$slot['end']}", $timezone);

            $available[$slot['key']] = $end->gt($now) && ! $this->overlapsBusy($start, $end, $busy);
        }

        return $available;
    }

    /**
     * @param  array<int, array{start: Carbon, end: Carbon}>  $busy
     */
    private function overlapsBusy(Carbon $start, Carbon $end, array $busy): bool
    {
        foreach ($busy as $period) {
            // Half-open overlap: [start, end) ∩ [busy.start, busy.end)
            if ($period['start']->lt($end) && $period['end']->gt($start)) {
                return true;
            }
        }

        return false;
    }
}
