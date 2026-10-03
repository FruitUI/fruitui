<?php

namespace FruitUI\Tests;

use Illuminate\Support\Facades\Blade;

class ComponentsTest extends TestCase
{
    public function test_attributes_reach_the_real_control_without_booting_livewire(): void
    {
        $button = Blade::render('<x-fruit::button variant="primary" class="custom" wire:click="save" wire:loading.attr="disabled" x-on:click="open">Save</x-fruit::button>');
        $this->assertStringContainsString('f-button--primary', $button);
        $this->assertStringContainsString('custom', $button);
        $this->assertStringContainsString('wire:click="save"', $button);
        $this->assertStringContainsString('wire:loading.attr="disabled"', $button);
        $this->assertStringContainsString('x-on:click="open"', $button);
        $this->assertStringContainsString('type="button"', $button);

        $switch = Blade::render('<x-fruit::switch wire:model.live="previews" id="previews" checked>Show previews</x-fruit::switch>');
        $this->assertMatchesRegularExpression('/<input[^>]+wire:model.live="previews"[^>]*>/', $switch);
        $this->assertStringContainsString('role="switch"', $switch);
        $this->assertStringContainsString('Show previews', $switch);
    }

    public function test_native_controls_and_slots_render(): void
    {
        $html = Blade::render('<x-fruit::card class="f-stack"><x-fruit::input type="email" required wire:model="email" /><x-fruit::select wire:model="mailbox"><option>Inbox</option></x-fruit::select><x-fruit::textarea wire:model="message">Hello</x-fruit::textarea><x-fruit::disclosure title="Details" open>More information</x-fruit::disclosure><x-fruit::dialog aria-label="Compose">Message</x-fruit::dialog></x-fruit::card>');
        $this->assertStringContainsString('f-card f-stack', $html);
        $this->assertStringContainsString('type="email"', $html);
        $this->assertStringContainsString('wire:model="email"', $html);
        $this->assertStringContainsString('<option>Inbox</option>', $html);
        $this->assertStringContainsString('>Hello</textarea>', $html);
        $this->assertStringContainsString('<summary>Details</summary>', $html);
        $this->assertStringContainsString('aria-label="Compose"', $html);
    }
}
