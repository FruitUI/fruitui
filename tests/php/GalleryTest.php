<?php

namespace FruitUI\Tests;

use FruitUI\FruitUIServiceProvider;
use FruitUI\Gallery\GalleryRenderer;
use Orchestra\Testbench\TestCase;

class GalleryTest extends TestCase
{
    protected function getPackageProviders($app): array
    {
        return [FruitUIServiceProvider::class];
    }

    public function test_gallery_specimens_are_rendered_from_their_blade_sources(): void
    {
        $root = dirname(__DIR__, 2);
        $page = file_get_contents("{$root}/components.html");
        $this->assertSame($page, GalleryRenderer::render($page, "{$root}/gallery/specimens"), 'Run composer gallery after changing a specimen or Blade adapter.');
    }

    public function test_every_blade_backed_catalog_entry_has_a_specimen(): void
    {
        $root = dirname(__DIR__, 2);
        $catalog = json_decode(file_get_contents("{$root}/docs/component-catalog.json"), true, flags: JSON_THROW_ON_ERROR);
        $expected = array_values(array_map(fn ($entry) => $entry['id'], array_filter($catalog, fn ($entry) => $entry['blade'] !== [])));
        $specimens = array_map(fn ($file) => basename($file, '.blade.php'), glob("{$root}/gallery/specimens/*.blade.php"));
        sort($expected);
        sort($specimens);
        $this->assertSame($expected, $specimens);
    }
}
