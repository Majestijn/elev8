<?php

use App\Http\Controllers\AvailabilityController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\InboxController;
use Illuminate\Support\Facades\Route;

// Landingspagina
Route::get('/', [BookingController::class, 'landing'])->name('home');

// Publieke klant-aanvraagflow (de link die Chris naar zijn klanten stuurt)
Route::get('/aanvragen', [BookingController::class, 'create'])->name('book');
Route::post('/aanvragen', [BookingController::class, 'store'])->name('book.store');

// Beschikbaarheid van tijdvakken op een dag (Google Calendar) — voor de flow
Route::get('/beschikbaarheid', [AvailabilityController::class, 'show'])->name('availability');

// Beheer-inbox — wachtwoord-gate + aanvragen-overzicht voor Chris
Route::get('/beheer', [InboxController::class, 'index'])->name('beheer');
Route::post('/beheer/login', [InboxController::class, 'login'])->name('beheer.login');
Route::post('/beheer/logout', [InboxController::class, 'logout'])->name('beheer.logout');
Route::post('/beheer/aanvragen/{booking}/status', [InboxController::class, 'updateStatus'])
    ->name('beheer.status');
Route::post('/beheer/aanvragen/{booking}/duur', [InboxController::class, 'updateDuration'])
    ->name('beheer.duration');
