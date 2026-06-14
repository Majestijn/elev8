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
        $to = config('whatsapp.to');

        // Niet (volledig) geconfigureerd → stil overslaan.
        if (! $token || ! $phoneNumberId || ! $to) {
            return;
        }

        $template = config('whatsapp.template');

        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $to,
            'type' => 'template',
            'template' => [
                'name' => $template,
                'language' => ['code' => config('whatsapp.language')],
            ],
        ];

        // hello_world is de Meta-testtemplate zonder parameters; een eigen
        // template krijgt de aanvraaggegevens als body-parameters mee.
        if ($template !== 'hello_world') {
            $payload['template']['components'] = [[
                'type' => 'body',
                'parameters' => array_map(
                    fn (string $text) => ['type' => 'text', 'text' => $text],
                    $this->bodyParameters($booking)
                ),
            ]];
        }

        try {
            $response = Http::withToken($token)
                ->timeout(5)
                ->post(
                    sprintf(
                        'https://graph.facebook.com/%s/%s/messages',
                        config('whatsapp.api_version'),
                        $phoneNumberId
                    ),
                    $payload
                );

            if ($response->failed()) {
                Log::warning('WhatsApp-melding mislukt', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('WhatsApp-melding gooide een exception', [
                'error' => $e->getMessage(),
            ]);
        }
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
