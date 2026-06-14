<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class Elev8Controller extends Controller
{
    /** Statussen die Chris in de inbox kan zetten (de pijplijn). */
    public const STATUSES = [
        'requested',   // Nieuw
        'contacted',   // Contact gelegd
        'scheduled',   // Ingepland
        'completed',   // Afgerond
        'cancelled',   // Geannuleerd
    ];

    /**
     * Chris' inbox — wachtwoord-gate, daarna alle aanvragen (gefilterd per
     * status in de frontend).
     */
    public function index(Request $request): Response
    {
        if (! $this->authed($request)) {
            return Inertia::render('Elev8Login');
        }

        $bookings = Booking::orderByDesc('created_at')
            ->get()
            ->map(fn (Booking $b) => $b->toInertia())
            ->values();

        return Inertia::render('Elev8Inbox', [
            'bookings' => $bookings,
        ]);
    }

    public function login(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'string']]);

        if (! hash_equals((string) config('elev8.password'), (string) $request->input('password'))) {
            throw ValidationException::withMessages([
                'password' => 'Onjuist wachtwoord, probeer het opnieuw.',
            ]);
        }

        $request->session()->put('elev8_authed', true);
        $request->session()->regenerate();

        return redirect('/elev8');
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget('elev8_authed');

        return redirect('/elev8');
    }

    public function updateStatus(Request $request, Booking $booking): RedirectResponse
    {
        abort_unless($this->authed($request), 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in(self::STATUSES)],
        ]);

        $booking->update([
            'status' => $validated['status'],
            // 'opgepakt op'-tijdstip: eerste keer dat 'ie van Nieuw af gaat.
            'handled_at' => $validated['status'] === 'requested'
                ? null
                : ($booking->handled_at ?? now()),
        ]);

        return back();
    }

    private function authed(Request $request): bool
    {
        return (bool) $request->session()->get('elev8_authed', false);
    }
}
