<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\Elev8Controller;
use Illuminate\Support\Facades\Route;

// Publieke klant-aanvraagflow (de link die Chris naar zijn klanten stuurt)
Route::get('/', [BookingController::class, 'create'])->name('book');
Route::post('/', [BookingController::class, 'store'])->name('book.store');

// elev8 inbox — wachtwoord-gate + aanvragen-overzicht voor Chris
Route::get('/elev8', [Elev8Controller::class, 'index'])->name('elev8');
Route::post('/elev8/login', [Elev8Controller::class, 'login'])->name('elev8.login');
Route::post('/elev8/logout', [Elev8Controller::class, 'logout'])->name('elev8.logout');
Route::post('/elev8/aanvragen/{booking}/handled', [Elev8Controller::class, 'toggleHandled'])
    ->name('elev8.handled');
