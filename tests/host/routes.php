<?php

use FruitUI\BrowserHost\AdoptionFixture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Livewire\Livewire::component('fruit-adoption', AdoptionFixture::class);
Route::get('/', fn () => view('host'));
Route::get('/preferences', fn () => view('host', ['component' => 'fruit-mail-preferences']));

// The Support reference interface as a Livewire single-file component (examples/laravel).
Livewire\Livewire::addComponent('fruit-support-desk', viewPath: dirname(__DIR__, 2).'/examples/laravel/support-desk.blade.php');
Route::get('/support/{mailbox?}', fn (string $mailbox = 'all') => view('host', ['component' => 'fruit-support-desk', 'parameters' => ['mailbox' => $mailbox]]));
Route::get('/support-reset', function () {
    session()->forget('fruit-support.tickets');

    return redirect('/support');
});

// Test-only native form endpoint verifies real received bytes, not a browser protocol approximation.
Route::post('/native-submit', function (Request $request) {
    $received = ['values' => $request->except('files'), 'files' => array_map(fn ($file) => ['name' => $file->getClientOriginalName(), 'content' => file_get_contents($file->getRealPath())], $request->file('files', []))];

    return response('<!doctype html><html lang="en"><title>Native submission</title><main><h1>Saved</h1><pre id="received">'.e(json_encode($received)).'</pre></main></html>');
});
