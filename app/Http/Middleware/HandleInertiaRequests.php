<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'flash' => [
                'bookingCode' => fn () => $request->session()->get('bookingCode'),
            ],
            'elev8' => [
                'authed' => (bool) $request->session()->get('elev8_authed', false),
            ],
            // Alleen aan in debug-modus → demo-/testknoppen verschijnen niet in productie.
            'appDebug' => (bool) config('app.debug'),
        ];
    }
}
