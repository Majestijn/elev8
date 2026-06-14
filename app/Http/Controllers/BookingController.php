<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\Calendar\SlotAvailability;
use App\Services\WhatsAppNotifier;
use App\Support\BookingSlots;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    private const JOB_TYPES = [
        'Bank',
        'Koelkast',
        'Wasmachine',
        'Volledige verhuizing',
        'Piano',
        'Bouwmaterialen',
        'Anders',
    ];

    /** Toegestane locatie-bijzonderheden (keys; labels staan in de frontend). */
    private const SITE_CONDITIONS = [
        'trees',
        'balconies',
        'cables',
        'narrow_street',
    ];

    /**
     * Landingspagina op urbanlift.nl met de CTA naar de aanvraagflow.
     */
    public function landing(): Response
    {
        return Inertia::render('Landing');
    }

    /**
     * Publieke aanvraag-flow — de link die Chris naar zijn klanten stuurt.
     */
    public function create(): Response
    {
        return Inertia::render('BookingFlow', [
            'slots' => BookingSlots::all(),
            'calendarEnabled' => BookingSlots::calendarEnabled(),
        ]);
    }

    /**
     * Sla een binnengekomen aanvraag op en toon het bedankt-scherm.
     */
    public function store(Request $request, WhatsAppNotifier $whatsapp, SlotAvailability $slots): RedirectResponse
    {
        $validated = $request->validate([
            'customerName' => ['required', 'string', 'min:2', 'max:120'],
            'customerEmail' => ['nullable', 'email', 'max:160'],
            'customerPhone' => ['required', 'string', 'min:6', 'max:40'],
            'postcode' => ['required', 'string', 'min:4', 'max:12'],
            'street' => ['required', 'string', 'min:2', 'max:160'],
            'city' => ['nullable', 'string', 'max:120'],
            'date' => ['required', 'date', 'after_or_equal:today'],
            'timeSlot' => ['required', 'string', Rule::in(BookingSlots::keys())],
            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.type' => ['required', 'string', Rule::in(self::JOB_TYPES)],
            'items.*.length' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'items.*.width' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'items.*.height' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'description' => ['nullable', 'string', 'max:2000'],
            'heaviestObjectKg' => ['required', 'integer', 'min:1', 'max:100000'],
            'floor' => ['required', 'integer', 'between:1,20'],
            'heightMeters' => ['nullable', 'integer', 'min:1', 'max:300'],
            'siteConditions' => ['nullable', 'array'],
            'siteConditions.*' => ['string', Rule::in(self::SITE_CONDITIONS)],
            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['file', 'mimes:jpeg,jpg,png,webp,heic,heif', 'max:8192'],
        ], [
            'customerName.required' => 'Vul je naam in.',
            'customerName.min' => 'Vul je volledige naam in.',
            'customerEmail.email' => 'Dit lijkt geen geldig e-mailadres.',
            'customerPhone.required' => 'Vul een telefoonnummer in.',
            'customerPhone.min' => 'Vul een geldig telefoonnummer in.',
            'postcode.required' => 'Vul een postcode in.',
            'street.required' => 'Vul straat en huisnummer in.',
            'date.required' => 'Kies een datum.',
            'date.after_or_equal' => 'Kies een datum vanaf vandaag.',
            'items.required' => 'Voeg minstens één object toe.',
            'items.min' => 'Voeg minstens één object toe.',
            'items.*.type.required' => 'Kies per object wat het is.',
            'items.*.type.in' => 'Kies een geldige optie.',
            'heaviestObjectKg.required' => 'Geef een schatting van het gewicht.',
            'floor.required' => 'Kies naar welke verdieping de lift moet.',
            'floor.between' => 'Kies een verdieping tussen 1 en 20.',
            'photos.max' => 'Je kunt maximaal 5 foto’s uploaden.',
            'photos.*.mimes' => 'Alleen foto’s (JPG, PNG, WEBP of HEIC).',
            'photos.*.max' => 'Elke foto mag maximaal 8 MB zijn.',
        ]);

        // Defense-in-depth tegen het omzeilen van de uitgegrijsde knop: alleen
        // relevant als de agenda-flow aan staat. Blokkeer enkel als het dagdeel
        // aantoonbaar bezet is (faalveilig — bij geen/onbereikbare agenda staat
        // alles op vrij, dus geen valse afwijzingen).
        if (BookingSlots::calendarEnabled()
            && ($slots->forDate($validated['date'])[$validated['timeSlot']] ?? true) === false) {
            throw ValidationException::withMessages([
                'timeSlot' => 'Dit tijdvak is net bezet geraakt. Kies een ander tijdvak.',
            ]);
        }

        // Bewaar de foto's op de geconfigureerde disk (lokaal 'public', later bucket).
        $photoPaths = [];
        foreach ($request->file('photos', []) as $photo) {
            $photoPaths[] = $photo->store('booking-photos', config('inbox.photo_disk'));
        }

        $booking = Booking::create([
            'code' => $this->generateCode(),
            'customer_name' => trim($validated['customerName']),
            'customer_email' => isset($validated['customerEmail']) ? trim($validated['customerEmail']) : null,
            'customer_phone' => trim($validated['customerPhone']),
            'items' => $this->normalizeItems($validated['items']),
            'site_conditions' => array_values($validated['siteConditions'] ?? []),
            'photos' => $photoPaths,
            'description' => isset($validated['description']) ? trim($validated['description']) : null,
            'heaviest_object_kg' => $validated['heaviestObjectKg'],
            'floor' => $validated['floor'],
            'height_meters' => $validated['heightMeters'] ?? null,
            'postcode' => strtoupper(trim($validated['postcode'])),
            'street' => trim($validated['street']),
            'city' => isset($validated['city']) ? trim($validated['city']) : null,
            'preferred_date' => $validated['date'],
            'time_slot' => $validated['timeSlot'],
            'status' => 'requested',
        ]);

        // Meld de nieuwe aanvraag aan Chris (faalveilig — blokkeert de boeking nooit).
        $whatsapp->notifyNewBooking($booking);

        return redirect('/aanvragen')->with('bookingCode', $booking->code);
    }

    /**
     * Maak van de aangeleverde objecten een schone, vaste vorm.
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function normalizeItems(array $items): array
    {
        return array_values(array_map(fn (array $item) => [
            'type' => $item['type'],
            'length' => $item['length'] ?? null,
            'width' => $item['width'] ?? null,
            'height' => $item['height'] ?? null,
        ], $items));
    }

    /**
     * Genereer een klantvriendelijke referentie, bv. UL-2606-AB12.
     */
    private function generateCode(): string
    {
        do {
            $suffix = strtoupper(substr(str_replace(['/', '+', '='], '', base64_encode(random_bytes(4))), 0, 4));
            $code = sprintf('UL-%s-%s', now()->format('ym'), $suffix);
        } while (Booking::where('code', $code)->exists());

        return $code;
    }
}
