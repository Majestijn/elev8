<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Booking extends Model
{
    protected $fillable = [
        'code',
        'customer_name',
        'customer_email',
        'customer_phone',
        'items',
        'site_conditions',
        'photos',
        'description',
        'heaviest_object_kg',
        'floor',
        'height_meters',
        'postcode',
        'street',
        'city',
        'preferred_date',
        'time_slot',
        'status',
        'handled_at',
        'duration_minutes',
    ];

    protected $casts = [
        'items' => 'array',
        'site_conditions' => 'array',
        'photos' => 'array',
        'preferred_date' => 'date',
        'handled_at' => 'datetime',
        'heaviest_object_kg' => 'integer',
        'floor' => 'integer',
        'height_meters' => 'integer',
        'duration_minutes' => 'integer',
    ];

    /**
     * Vorm zoals de frontend (Inertia/React) het verwacht: camelCase.
     *
     * @return array<string, mixed>
     */
    public function toInertia(): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'customerName' => $this->customer_name,
            'customerEmail' => $this->customer_email,
            'customerPhone' => $this->customer_phone,
            'items' => $this->items ?? [],
            'siteConditions' => $this->site_conditions ?? [],
            'photos' => collect($this->photos ?? [])
                ->map(fn (string $path) => Storage::disk(config('inbox.photo_disk'))->url($path))
                ->all(),
            'description' => $this->description,
            'heaviestObjectKg' => $this->heaviest_object_kg,
            'floor' => $this->floor,
            'heightMeters' => $this->height_meters,
            'postcode' => $this->postcode,
            'street' => $this->street,
            'city' => $this->city,
            'date' => optional($this->preferred_date)->toDateString(),
            'timeSlot' => $this->time_slot,
            'status' => $this->status,
            'durationMinutes' => $this->duration_minutes,
            'handledAt' => optional($this->handled_at)->toIso8601String(),
            'createdAt' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
