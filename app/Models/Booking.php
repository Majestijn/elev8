<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'code',
        'customer_name',
        'customer_email',
        'customer_phone',
        'job_type',
        'description',
        'heaviest_object_kg',
        'postcode',
        'street',
        'city',
        'preferred_date',
        'time_slot',
        'status',
        'handled_at',
    ];

    protected $casts = [
        'preferred_date' => 'date',
        'handled_at' => 'datetime',
        'heaviest_object_kg' => 'integer',
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
            'jobType' => $this->job_type,
            'description' => $this->description,
            'heaviestObjectKg' => $this->heaviest_object_kg,
            'postcode' => $this->postcode,
            'street' => $this->street,
            'city' => $this->city,
            'date' => optional($this->preferred_date)->toDateString(),
            'timeSlot' => $this->time_slot,
            'status' => $this->status,
            'handledAt' => optional($this->handled_at)->toIso8601String(),
            'createdAt' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
