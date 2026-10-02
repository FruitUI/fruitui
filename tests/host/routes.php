<?php
Livewire\Livewire::component('fruit-adoption', FruitUI\BrowserHost\AdoptionFixture::class);
Illuminate\Support\Facades\Route::get('/', fn () => view('host'));
Illuminate\Support\Facades\Route::get('/preferences', fn () => view('host', ['component' => 'fruit-mail-preferences']));

// Test-only native form endpoint verifies real received bytes, not a browser protocol approximation.
Illuminate\Support\Facades\Route::post('/native-submit', function (Illuminate\Http\Request $request) {
    $received = ['values' => $request->except('files'), 'files' => array_map(fn ($file) => ['name' => $file->getClientOriginalName(), 'content' => file_get_contents($file->getRealPath())], $request->file('files', []))];
    return response('<!doctype html><html lang="en"><title>Native submission</title><main><h1>Saved</h1><pre id="received">'.e(json_encode($received)).'</pre></main></html>');
});
