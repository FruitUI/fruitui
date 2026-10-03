<?php

// Renders gallery/specimens/*.blade.php into components.html. Usage: php scripts/render-gallery.php [--check]
require __DIR__.'/../vendor/autoload.php';

use FruitUI\FruitUIServiceProvider;
use FruitUI\Gallery\GalleryRenderer;
use Orchestra\Testbench\Foundation\Application;

$root = dirname(__DIR__);
$app = Application::create(options: ['extra' => ['providers' => [FruitUIServiceProvider::class]]]);
$app['config']->set('session.driver', 'array');
$app['config']->set('view.compiled', sys_get_temp_dir().'/fruitui-gallery-views');
@mkdir($app['config']->get('view.compiled'), 0777, true);

$page = file_get_contents("{$root}/components.html");
$rendered = GalleryRenderer::render($page, "{$root}/gallery/specimens");
if (in_array('--check', $argv, true)) {
    if ($rendered !== $page) {
        fwrite(STDERR, "components.html is out of date. Run composer gallery.\n");
        exit(1);
    }
    exit(0);
}
file_put_contents("{$root}/components.html", $rendered);
