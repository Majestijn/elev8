<?php

namespace App\Services\Calendar;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Leest bezet-blokken uit Google Calendar via de FreeBusy-API met een
 * service-account (server-to-server, geen inlog-flow). De agenda moet read-only
 * gedeeld zijn met het service-account-mailadres.
 *
 * Faalveilig: elke fout (geen/foute credentials, API down, timeout) wordt
 * gelogd en geeft een lege lijst terug zodat de klantflow blijft werken.
 */
class GoogleCalendarAvailability implements CalendarAvailability
{
    private const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
    private const DEFAULT_TOKEN_URI = 'https://oauth2.googleapis.com/token';
    private const FREEBUSY_URL = 'https://www.googleapis.com/calendar/v3/freeBusy';

    public function __construct(
        private readonly string $calendarId,
        private readonly string $credentials,
    ) {}

    public function busyPeriods(Carbon $from, Carbon $to): array
    {
        try {
            $token = $this->accessToken();
            if ($token === null) {
                Log::warning('Google Calendar: geen access-token verkregen (controleer credentials).');

                return [];
            }

            $response = Http::withToken($token)->timeout(8)->post(self::FREEBUSY_URL, [
                'timeMin' => $from->toRfc3339String(),
                'timeMax' => $to->toRfc3339String(),
                'items' => [['id' => $this->calendarId]],
            ]);

            if ($response->failed()) {
                Log::warning('Google Calendar FreeBusy faalde', ['status' => $response->status()]);

                return [];
            }

            // Let op: directe array-toegang i.p.v. data_get("calendars.{id}.busy"):
            // een calendar-ID is meestal een e-mailadres en bevat punten (.com),
            // die data_get als nesting-scheiding zou interpreteren.
            $busy = $response->json()['calendars'][$this->calendarId]['busy'] ?? [];

            return array_map(fn (array $b) => [
                'start' => Carbon::parse($b['start']),
                'end' => Carbon::parse($b['end']),
            ], $busy);
        } catch (Throwable $e) {
            Log::warning('Google Calendar beschikbaarheid faalde: '.$e->getMessage());

            return [];
        }
    }

    /** Haal (en cache) een OAuth-access-token op via een service-account-JWT. */
    private function accessToken(): ?string
    {
        $cached = Cache::get('google_calendar.access_token');
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $sa = $this->serviceAccount();
        $tokenUri = $sa['token_uri'] ?? self::DEFAULT_TOKEN_URI;
        $now = time();

        $jwt = $this->signJwt([
            'iss' => $sa['client_email'],
            'scope' => self::SCOPE,
            'aud' => $tokenUri,
            'iat' => $now,
            'exp' => $now + 3600,
        ], $sa['private_key']);

        $response = Http::asForm()->timeout(8)->post($tokenUri, [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        $token = $response->json('access_token');

        // Alleen een geldig token cachen — nooit een mislukking 55 min vasthouden.
        if (is_string($token) && $token !== '') {
            Cache::put('google_calendar.access_token', $token, 3300);

            return $token;
        }

        Log::warning('Google Calendar token-uitwisseling faalde', ['status' => $response->status()]);

        return null;
    }

    /** @return array<string, mixed> geparste service-account-credentials */
    private function serviceAccount(): array
    {
        $raw = str_starts_with(ltrim($this->credentials), '{')
            ? $this->credentials
            : (string) file_get_contents($this->credentials);

        $data = json_decode($raw, true);

        if (! is_array($data) || empty($data['client_email']) || empty($data['private_key'])) {
            throw new RuntimeException('Ongeldige Google service-account credentials.');
        }

        return $data;
    }

    private function signJwt(array $claims, string $privateKey): string
    {
        $segments = [
            $this->base64Url((string) json_encode(['alg' => 'RS256', 'typ' => 'JWT'])),
            $this->base64Url((string) json_encode($claims)),
        ];

        $signature = '';
        if (! openssl_sign(implode('.', $segments), $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('Ondertekenen van de Google-JWT is mislukt.');
        }

        $segments[] = $this->base64Url($signature);

        return implode('.', $segments);
    }

    private function base64Url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
