<?php

namespace App\Providers;

use App\Services\Calendar\CalendarAvailability;
use App\Services\Calendar\GoogleCalendarAvailability;
use App\Services\Calendar\NullCalendarAvailability;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Google Calendar alleen gebruiken als 'ie volledig geconfigureerd is;
        // anders de faalveilige null-variant (→ alle tijdvakken boekbaar).
        $this->app->bind(CalendarAvailability::class, function () {
            $calendarId = config('services.google.calendar_id');
            $credentials = config('services.google.credentials');

            if (! empty($calendarId) && ! empty($credentials)) {
                return new GoogleCalendarAvailability($calendarId, $credentials);
            }

            return new NullCalendarAvailability;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
