<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\Elev8Controller;
use Illuminate\Support\Facades\Route;

// Landingspagina
Route::get('/', [BookingController::class, 'landing'])->name('home');

// Publieke klant-aanvraagflow (de link die Chris naar zijn klanten stuurt)
Route::get('/aanvragen', [BookingController::class, 'create'])->name('book');
Route::post('/aanvragen', [BookingController::class, 'store'])->name('book.store');

// elev8 inbox — wachtwoord-gate + aanvragen-overzicht voor Chris
Route::get('/elev8', [Elev8Controller::class, 'index'])->name('elev8');
Route::post('/elev8/login', [Elev8Controller::class, 'login'])->name('elev8.login');
Route::post('/elev8/logout', [Elev8Controller::class, 'logout'])->name('elev8.logout');
Route::post('/elev8/aanvragen/{booking}/status', [Elev8Controller::class, 'updateStatus'])
    ->name('elev8.status');
