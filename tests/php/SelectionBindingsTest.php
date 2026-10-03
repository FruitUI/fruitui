<?php

namespace FruitUI\Tests;

use Illuminate\Support\Facades\Blade;
use Livewire\Component;
use Livewire\Livewire;

class SelectionBindingsTest extends TestCase
{
    public function test_checkbox_and_radio_bindings_save_boolean_and_group_values(): void
    {
        Livewire::test(SelectionBindingsFixture::class)
            ->assertSet('sounds', false)
            ->assertSet('density', 'comfortable')
            ->assertSeeHtml('wire:model="sounds"')
            ->assertSeeHtml('wire:model="density"')
            ->set('sounds', true)
            ->set('density', 'compact')
            ->call('save')
            ->assertHasNoErrors()
            ->assertSet('saved', ['sounds' => true, 'density' => 'compact'])
            ->set('sounds', false)
            ->call('save')
            ->assertSet('saved', ['sounds' => false, 'density' => 'compact']);
    }
}

class SelectionBindingsFixture extends Component
{
    public bool $sounds = false;

    public string $density = 'comfortable';

    public array $saved = [];

    public function save(): void
    {
        $this->saved = $this->validate([
            'sounds' => ['boolean'],
            'density' => ['in:comfortable,compact'],
        ]);
    }

    public function render(): string
    {
        return Blade::render('<form wire:submit="save"><x-fruit::checkbox wire:model="sounds">Sounds</x-fruit::checkbox><fieldset><legend>Density</legend><x-fruit::radio name="density" value="comfortable" wire:model="density">Comfortable</x-fruit::radio><x-fruit::radio name="density" value="compact" wire:model="density">Compact</x-fruit::radio></fieldset><x-fruit::button type="submit">Save</x-fruit::button></form>');
    }
}
