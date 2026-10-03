<?php

namespace FruitUI;

use FruitUI\View\Components\Field;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;
use Livewire\Livewire;

class FruitUIServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Blade::component(Field::class, 'fruit::field');
        Blade::anonymousComponentPath(__DIR__.'/../../resources/views/components', 'fruit');
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'fruit');

        // The CSS and Blade components work without installing Livewire.
        if (class_exists(Livewire::class) && $this->app->bound('livewire')) {
            Livewire::addComponent('fruit-mail-preferences', viewPath: __DIR__.'/../../resources/views/livewire/mail-preferences.blade.php');
        }
    }
}
