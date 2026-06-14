<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();

            // Klantgegevens
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone');

            // Klus — objecten als JSON-array: [{type, length, width, height}, ...]
            $table->jsonb('items');
            // Locatie-bijzonderheden als JSON-array van keys: ["trees", "cables", ...]
            $table->jsonb('site_conditions')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('heaviest_object_kg')->nullable();

            // Locatie
            $table->string('postcode');
            $table->string('street');
            $table->string('city')->nullable();

            // Wanneer
            $table->date('preferred_date');
            $table->string('time_slot');

            // Status / opvolging door elev8
            $table->string('status')->default('requested');
            $table->timestamp('handled_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
