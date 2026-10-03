<?php

namespace FruitUI;

use FruitUI\View\Components\Field;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class FruitUIServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $views = __DIR__.'/../../resources/views';

        // Anonymous adapters resolve as fruit::components.*, so published overrides apply too.
        $this->loadViewsFrom($views, 'fruit');
        Blade::component(Field::class, 'fruit::field');

        // Livewire's pagination_theme 'fruit' resolves livewire::fruit and livewire::simple-fruit.
        $this->callAfterResolving('view', fn ($factory) => $factory->addNamespace('livewire', "{$views}/pagination/livewire"));

        $this->publishes([$views => resource_path('views/vendor/fruit')], 'fruit-views');
    }
}
