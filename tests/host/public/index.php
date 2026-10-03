<?php

use FruitUI\FruitUIServiceProvider;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Livewire\LivewireServiceProvider;

// Isolated browser-test host. All generated state stays under the FruitUI checkout.
require dirname(__DIR__, 3).'/vendor/autoload.php';
require dirname(__DIR__).'/AdoptionFixture.php';

$base = dirname(__DIR__);
foreach (['bootstrap/cache', 'storage/framework/cache', 'storage/framework/views', 'storage/framework/sessions', 'storage/logs'] as $directory) {
    if (! is_dir("{$base}/.runtime/{$directory}")) {
        mkdir("{$base}/.runtime/{$directory}", 0777, true);
    }
}
$app = Application::configure(basePath: $base)
    ->withExceptions()
    ->withMiddleware(fn (Middleware $middleware) => $middleware->validateCsrfTokens(except: ['native-submit']))
    ->withProviders([LivewireServiceProvider::class, FruitUIServiceProvider::class])
    ->withRouting(web: "{$base}/routes.php")
    ->create();
$app->useBootstrapPath("{$base}/.runtime/bootstrap");
$app->useStoragePath("{$base}/.runtime/storage");
$app->handleRequest(Request::capture());
