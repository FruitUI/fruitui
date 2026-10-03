<?php

namespace FruitUI\Tests;

use DOMDocument;
use DOMXPath;
use FruitUI\FruitUIServiceProvider;
use Illuminate\Support\Facades\Blade;
use Illuminate\View\ViewException;
use InvalidArgumentException;
use Livewire\LivewireServiceProvider;
use Orchestra\Testbench\TestCase as Testbench;

abstract class TestCase extends Testbench
{
    protected function getPackageProviders($app): array
    {
        return [LivewireServiceProvider::class, FruitUIServiceProvider::class];
    }

    protected function getEnvironmentSetUp($app): void
    {
        $app['config']->set('app.key', str_repeat('a', 32));
        $app['config']->set('session.driver', 'array');
        $app['config']->set('livewire.pagination_theme', 'fruit');
    }

    protected function document(string $html): DOMDocument
    {
        $document = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        try {
            $document->loadHTML('<?xml encoding="utf-8"?>'.$html);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        return $document;
    }

    protected function xpath(string $html): DOMXPath
    {
        return new DOMXPath($this->document($html));
    }

    /** Assert that rendering fails with a component contract violation, optionally containing $message. */
    protected function assertRejected(string $template, string $message = '', array $data = []): void
    {
        try {
            Blade::render($template, $data);
        } catch (ViewException $exception) {
            $cause = $exception;
            while ($cause->getPrevious()) {
                $cause = $cause->getPrevious();
            }
            $this->assertInstanceOf(InvalidArgumentException::class, $cause);
            $this->assertStringContainsString($message, $cause->getMessage());

            return;
        }
        $this->fail('An unsupported component contract rendered without an error.');
    }
}
