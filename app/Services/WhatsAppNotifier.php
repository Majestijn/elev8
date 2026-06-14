<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Stuurt Chris een WhatsApp-melding bij een nieuwe aanvraag, via de Meta
 * WhatsApp Cloud API. Faalveilig: bij ontbrekende config of een fout gooit
 * dit nooit door (de boeking van de klant mag er niet op stuklopen).
 */
class WhatsAppNotifier
{
    public function notifyNewBooking(Booking $booking): void
    {
        $token = config('whatsapp.token');
        $phoneNumberId = config('whatsapp.phone_number_id');
        $recipients = $this->recipients();

        // Niet (volledig) geconfigureerd → stil overslaan.
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
                    $this->bodyParameters($booking)
                ),
            ]];
        }

        $url = sprintf(
            'https://graph.facebook.com/%s/%s/messages',
            config('whatsapp.api_version'),
            $phoneNumberId
        );

        // Eén bericht per ontvanger (bv. Chris + Stijn tijdens de transitie).
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
     * Eén of meer ontvangers uit WHATSAPP_TO, komma- of puntkomma-gescheiden.
     *
     * @return array<int, string>
     */
    private function recipients(): array
    {
        return collect(preg_split('/[,;]/', (string) config('whatsapp.to')))
            ->map(fn ($number) => trim($number))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Vier body-parameters voor een eigen template, in vaste volgorde:
     * {{1}} naam · {{2}} klus + plaats · {{3}} wanneer · {{4}} telefoon.
     *
     * @return array<int, string>
     */
    private function bodyParameters(Booking $booking): array
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
