<?php

use FruitUI\BrowserHost\AdoptionFixture;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Livewire\Livewire::component('fruit-adoption', AdoptionFixture::class);
Route::get('/', fn () => view('host'));
// Reference interfaces as Livewire single-file components (examples/laravel).
$examples = dirname(__DIR__, 2).'/examples/laravel';
Livewire\Livewire::addComponent('fruit-mail-preferences', viewPath: "{$examples}/mail-preferences.blade.php");
Livewire\Livewire::addComponent('fruit-support-desk', viewPath: "{$examples}/support-desk.blade.php");
Route::get('/preferences', fn () => view('host', ['component' => 'fruit-mail-preferences']));
Livewire\Livewire::addComponent('fruit-settings', viewPath: "{$examples}/settings.blade.php");
Route::get('/settings', fn () => view('host', ['component' => 'fruit-settings']));
Route::get('/support/{mailbox?}', fn (string $mailbox = 'all') => view('host', ['component' => 'fruit-support-desk', 'parameters' => ['mailbox' => $mailbox]]));

// An application shell whose sidebar persists across wire:navigate.
Route::get('/shell/{page}', fn (string $page) => view('shell', ['page' => $page]))->whereIn('page', ['inbox', 'preferences']);

// The same desk with Livewire's injected scripts and FruitUI's self-registering entry, as in starter kits.
Route::get('/injected/support/{mailbox?}', fn (string $mailbox = 'all') => view('injected', ['mailbox' => $mailbox]));
Route::get('/toast-action', fn () => view('toast-action'));

// Test-only native form endpoint verifies real received bytes, not a browser protocol approximation.
Route::post('/native-submit', function (Request $request) {
    $received = ['values' => $request->except('files'), 'files' => array_map(fn ($file) => ['name' => $file->getClientOriginalName(), 'content' => file_get_contents($file->getRealPath())], $request->file('files', []))];

    return response('<!doctype html><html lang="en"><title>Native submission</title><main><h1>Saved</h1><pre id="received">'.e(json_encode($received)).'</pre></main></html>');
});
