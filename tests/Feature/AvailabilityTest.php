<?php

namespace Tests\Feature;

use App\Services\Calendar\CalendarAvailability;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AvailabilityTest extends TestCase
{
    use RefreshDatabase;

    /** Faken van de agenda met vaste bezet-blokken ([start, end]-paren). */
    private function fakeCalendar(array $busy): void
    {
        $this->swap(CalendarAvailability::class, new class($busy) implements CalendarAvailability
        {
            public function __construct(private array $busy) {}

            public function busyPeriods(Carbon $from, Carbon $to): array
            {
                return array_map(fn (array $b) => [
                    'start' => Carbon::parse($b[0]),
                    'end' => Carbon::parse($b[1]),
                ], $this->busy);
            }
        });
    }

    public function test_all_dayparts_available_without_calendar_config(): void
    {
        // Default binding = NullCalendarAvailability (geen Google-config in tests).
        $date = now()->addDay()->toDateString();

        $this->getJson("/beschikbaarheid?date={$date}")
            ->assertOk()
            ->assertJson([
                'date' => $date,
                'available' => ['ochtend' => true, 'middag' => true, 'avond' => true],
                'suggestions' => [],
            ]);
    }

    public function test_busy_period_marks_only_overlapping_daypart_unavailable(): void
    {
        $date = now()->addDay()->toDateString();
        $tz = config('booking.timezone');

        // Bezet 10:30–11:00 → overlapt alleen Ochtend (08:00–12:00).
        $this->fakeCalendar([[
            Carbon::parse("{$date} 10:30", $tz),
            Carbon::parse("{$date} 11:00", $tz),
        ]]);

        $this->getJson("/beschikbaarheid?date={$date}")
            ->assertOk()
            ->assertJsonPath('available.ochtend', false)
            ->assertJsonPath('available.middag', true)
            ->assertJsonPath('available.avond', true);
    }

    public function test_daypart_touching_a_busy_edge_stays_available(): void
    {
        $date = now()->addDay()->toDateString();
        $tz = config('booking.timezone');

        // Bezet 06:00–08:00 → grenst aan Ochtend (start 08:00), overlapt niet.
        $this->fakeCalendar([[
            Carbon::parse("{$date} 06:00", $tz),
            Carbon::parse("{$date} 08:00", $tz),
        ]]);

        $this->getJson("/beschikbaarheid?date={$date}")
            ->assertOk()
            ->assertJsonPath('available.ochtend', true);
    }

    public function test_full_day_triggers_suggestions_for_nearby_free_days(): void
    {
        $date = now()->addDay()->toDateString();
        $tz = config('booking.timezone');

        // De hele gekozen dag bezet → alle dagdelen vol → suggesties verwacht.
        $this->fakeCalendar([[
            Carbon::parse("{$date} 00:00", $tz),
            Carbon::parse("{$date} 23:59", $tz),
        ]]);

        $response = $this->getJson("/beschikbaarheid?date={$date}")
            ->assertOk()
            ->assertJsonPath('available.ochtend', false)
            ->assertJsonPath('available.middag', false)
            ->assertJsonPath('available.avond', false);

        // Top-2 nabije dagen, volledig vrij (3 dagdelen).
        $response->assertJsonCount(2, 'suggestions')
            ->assertJsonPath('suggestions.0.free', 3);
    }

    public function test_date_is_required(): void
    {
        $this->getJson('/beschikbaarheid')->assertStatus(422);
    }
}
