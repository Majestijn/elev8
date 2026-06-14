<?php

namespace Tests\Feature;

use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BookingFlowTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'customerName' => 'Jan de Vries',
            'customerEmail' => 'jan@example.nl',
            'customerPhone' => '+31 6 12345678',
            'postcode' => '1015 CW',
            'street' => 'Prinsengracht 412',
            'city' => 'Amsterdam',
            'date' => now()->addDay()->toDateString(),
            'timeSlot' => '10:00',
            'items' => [
                ['type' => 'Piano', 'length' => 180, 'width' => 60, 'height' => 120],
                ['type' => 'Bank'],
            ],
            'description' => '3e verdieping, grachtenpand',
            'heaviestObjectKg' => 250,
        ], $overrides);
    }

    public function test_booking_flow_page_renders(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('BookingFlow'));
    }

    public function test_customer_can_submit_a_request_and_it_persists(): void
    {
        $response = $this->post('/', $this->validPayload());

        $response->assertRedirect('/');
        $response->assertSessionHas('bookingCode');

        $this->assertDatabaseCount('bookings', 1);
        $booking = Booking::first();

        $this->assertSame('Jan de Vries', $booking->customer_name);
        $this->assertCount(2, $booking->items);
        $this->assertSame('Piano', $booking->items[0]['type']);
        $this->assertSame(180, $booking->items[0]['length']);
        $this->assertSame('Bank', $booking->items[1]['type']);
        $this->assertNull($booking->items[1]['length']);
        $this->assertSame(250, $booking->heaviest_object_kg);
        $this->assertSame('requested', $booking->status);
        $this->assertNull($booking->handled_at);
        $this->assertStringStartsWith('UL-', $booking->code);
    }

    public function test_invalid_request_is_rejected(): void
    {
        $this->from('/')
            ->post('/', $this->validPayload([
                'customerName' => '',
                'customerPhone' => '',
                'heaviestObjectKg' => 0,
            ]))
            ->assertRedirect('/')
            ->assertSessionHasErrors(['customerName', 'customerPhone', 'heaviestObjectKg']);

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_inbox_is_gated_behind_password(): void
    {
        $this->get('/elev8')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Elev8Login'));
    }

    public function test_wrong_password_is_rejected(): void
    {
        $this->from('/elev8')
            ->post('/elev8/login', ['password' => 'fout'])
            ->assertRedirect('/elev8')
            ->assertSessionHasErrors('password');
    }

    public function test_correct_password_grants_access_and_lists_requests(): void
    {
        // Een binnengekomen aanvraag
        $this->post('/', $this->validPayload());

        $this->post('/elev8/login', ['password' => 'elev8'])
            ->assertRedirect('/elev8');

        $this->get('/elev8')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Elev8Inbox')
                ->has('bookings', 1)
                ->where('bookings.0.customerName', 'Jan de Vries')
                ->where('bookings.0.items.0.type', 'Piano')
                ->where('bookings.0.items.0.length', 180)
            );
    }

    public function test_at_least_one_object_is_required(): void
    {
        $this->from('/')
            ->post('/', $this->validPayload(['items' => []]))
            ->assertRedirect('/')
            ->assertSessionHasErrors('items');

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_object_without_type_is_rejected(): void
    {
        $this->from('/')
            ->post('/', $this->validPayload([
                'items' => [['length' => 100]],
            ]))
            ->assertRedirect('/')
            ->assertSessionHasErrors('items.0.type');

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_request_can_be_marked_handled(): void
    {
        $this->post('/', $this->validPayload());
        $booking = Booking::first();

        $this->withSession(['elev8_authed' => true])
            ->post("/elev8/aanvragen/{$booking->id}/handled", ['handled' => true])
            ->assertRedirect();

        $this->assertNotNull($booking->fresh()->handled_at);

        // En weer terug naar nieuw
        $this->withSession(['elev8_authed' => true])
            ->post("/elev8/aanvragen/{$booking->id}/handled", ['handled' => false]);

        $this->assertNull($booking->fresh()->handled_at);
    }

    public function test_handle_action_requires_auth(): void
    {
        $this->post('/', $this->validPayload());
        $booking = Booking::first();

        $this->post("/elev8/aanvragen/{$booking->id}/handled", ['handled' => true])
            ->assertForbidden();
    }
}
