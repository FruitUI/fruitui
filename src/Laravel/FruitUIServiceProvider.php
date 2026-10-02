<?php

namespace FruitUI;

use FruitUI\Livewire\MailPreferences;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;
use Livewire\Livewire;

class FruitUIServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Blade::component(\FruitUI\View\Components\Field::class, 'fruit::field');
        Blade::anonymousComponentPath(__DIR__.'/../../resources/views/components', 'fruit');
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'fruit');

        // The CSS and Blade components work without installing Livewire.
        if (class_exists(Livewire::class) && $this->app->bound('livewire')) {
            Livewire::component('fruit-mail-preferences', MailPreferences::class);
        }
    }
}
