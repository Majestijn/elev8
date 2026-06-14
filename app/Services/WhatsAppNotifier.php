<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Stuurt een WhatsApp-melding bij een nieuwe aanvraag. Faalveilig: bij
 * ontbrekende config of een fout gooit dit nooit door (de boeking van de
 * klant mag er niet op stuklopen).
 *
 * Driver instelbaar via WHATSAPP_DRIVER:
 *   - 'callmebot' : simpele HTTP-call, geen Meta nodig (MVP-route).
 *   - 'meta'      : Meta WhatsApp Cloud API (officieel, template-based).
 *   - anders      : niets sturen.
 */
class WhatsAppNotifier
{
    public function notifyNewBooking(Booking $booking): void
    {
        match (config('whatsapp.driver')) {
            'callmebot' => $this->sendViaCallMeBot($booking),
            'meta' => $this->sendViaMeta($booking),
            default => null,
        };
    }

    /* ───────────────────────── CallMeBot (geen Meta) ───────────────────── */

    private function sendViaCallMeBot(Booking $booking): void
    {
        $recipients = $this->callMeBotRecipients();
        if (empty($recipients)) {
            return;
        }

        $text = $this->message($booking);

        foreach ($recipients as [$phone, $apikey]) {
            try {
                $response = Http::timeout(8)->get('https://api.callmebot.com/whatsapp.php', [
                    'phone' => $phone,
                    'apikey' => $apikey,
                    'text' => $text,
                ]);

                if ($response->failed()) {
                    Log::warning('CallMeBot-melding mislukt', [
                        'phone' => $phone,
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning('CallMeBot-melding gooide een exception', [
                    'phone' => $phone,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Ontvangers uit CALLMEBOT_RECIPIENTS: "phone:apikey,phone:apikey".
     * Elk nummer heeft bij CallMeBot een eigen apikey.
     *
     * @return array<int, array{0: string, 1: string}>
     */
    private function callMeBotRecipients(): array
    {
        return collect(preg_split('/[,;]/', (string) config('whatsapp.callmebot_recipients')))
            ->map(fn ($pair) => trim($pair))
            ->filter()
            ->map(function ($pair) {
                $parts = explode(':', $pair, 2);

                return [trim($parts[0] ?? ''), trim($parts[1] ?? '')];
            })
            ->filter(fn ($p) => $p[0] !== '' && $p[1] !== '')
            ->values()
            ->all();
    }

    /** Vrije-tekst melding (CallMeBot heeft geen template nodig). */
    private function message(Booking $booking): string
    {
        $types = collect($booking->items ?? [])->pluck('type')->implode(', ');
        $place = $booking->city ?: $booking->postcode;
        $when = Carbon::parse($booking->preferred_date)->format('d-m-Y').' '.$booking->time_slot;
        $url = rtrim((string) config('app.url'), '/').'/beheer';

        return "🚚 Nieuwe UrbanLift-aanvraag\n"
            ."Van: {$booking->customer_name}\n"
            ."Klus: ".trim($types.($place ? ' · '.$place : ''))."\n"
            ."Wanneer: {$when} · {$booking->floor}e verdieping\n"
            ."Tel: {$booking->customer_phone}\n"
            ."Bekijk: {$url}";
    }

    /* ───────────────────────── Meta WhatsApp Cloud API ─────────────────── */

    private function sendViaMeta(Booking $booking): void
    {
        $token = config('whatsapp.token');
        $phoneNumberId = config('whatsapp.phone_number_id');
        $recipients = $this->metaRecipients();

        if (! $token || ! $phoneNumberId || empty($recipients)) {
            return;
        }

        $template = config('whatsapp.template');

        $base = [
            'messaging_product' => 'whatsapp',
            'type' => 'template',
            'template' => [
                'name' => $template,
                'language' => ['code' => config('whatsapp.language')],
            ],
        ];

        // hello_world is de Meta-testtemplate zonder parameters; een eigen
        // template krijgt de aanvraaggegevens als body-parameters mee.
        if ($template !== 'hello_world') {
            $base['template']['components'] = [[
                'type' => 'body',
                'parameters' => array_map(
                    fn (string $text) => ['type' => 'text', 'text' => $text],
                    $this->metaBodyParameters($booking)
                ),
            ]];
        }

        $url = sprintf(
            'https://graph.facebook.com/%s/%s/messages',
            config('whatsapp.api_version'),
            $phoneNumberId
        );

        foreach ($recipients as $to) {
            try {
                $response = Http::withToken($token)
                    ->timeout(5)
                    ->post($url, array_merge($base, ['to' => $to]));

                if ($response->failed()) {
                    Log::warning('WhatsApp-melding mislukt', [
                        'to' => $to,
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning('WhatsApp-melding gooide een exception', [
                    'to' => $to,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Eén of meer Meta-ontvangers uit WHATSAPP_TO, komma-gescheiden.
     *
     * @return array<int, string>
     */
    private function metaRecipients(): array
    {
        return collect(preg_split('/[,;]/', (string) config('whatsapp.to')))
            ->map(fn ($number) => trim($number))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Vier body-parameters voor een eigen Meta-template, in vaste volgorde:
     * {{1}} naam · {{2}} klus + plaats · {{3}} wanneer · {{4}} telefoon.
     *
     * @return array<int, string>
     */
    private function metaBodyParameters(Booking $booking): array
    {
        $types = collect($booking->items ?? [])->pluck('type')->implode(', ');
        $place = $booking->city ?: $booking->postcode;

        return [
            $booking->customer_name,
            trim($types.($place ? ' · '.$place : '')),
            Carbon::parse($booking->preferred_date)->format('d-m-Y').' '.$booking->time_slot,
            $booking->customer_phone,
        ];
    }
}
