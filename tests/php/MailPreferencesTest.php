<?php

namespace FruitUI\Tests;

use FruitUI\FruitUIServiceProvider;
use FruitUI\Livewire\MailPreferences;
use Livewire\Livewire;
use Livewire\LivewireServiceProvider;
use Orchestra\Testbench\TestCase;

class MailPreferencesTest extends TestCase
{
    protected function getEnvironmentSetUp($app): void
    {
        $app['config']->set('app.key', str_repeat('a', 32));
        $app['config']->set('session.driver', 'array');
    }

    protected function getPackageProviders($app): array
    {
        return [LivewireServiceProvider::class, FruitUIServiceProvider::class];
    }

    public function test_preferences_save_to_session_and_reload(): void
    {
        Livewire::test('fruit-mail-preferences')
            ->assertSet('previews', true)
            ->set('previews', false)
            ->set('sounds', true)
            ->call('save')
            ->assertHasNoErrors()
            ->assertSee('Changes saved.')
            ->assertSet('saved', true)
            ->set('sounds', false)
            ->assertSet('saved', false);

        Livewire::test(MailPreferences::class)
            ->assertSet('previews', false)
            ->assertSet('sounds', true);
    }
}
