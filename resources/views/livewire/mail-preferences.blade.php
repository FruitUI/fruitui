<?php

use Livewire\Component;

new class extends Component
{
    public bool $previews = true;
    public bool $sounds = false;
    public bool $saved = false;

    public function mount(): void
    {
        $preferences = session('fruitui.mail-preferences', []);
        $this->previews = (bool) ($preferences['previews'] ?? true);
        $this->sounds = (bool) ($preferences['sounds'] ?? false);
    }

    public function updated(): void
    {
        $this->saved = false;
    }

    public function save(): void
    {
        $preferences = $this->validate([
            'previews' => ['required', 'boolean'],
            'sounds' => ['required', 'boolean'],
        ]);

        session(['fruitui.mail-preferences' => $preferences]);
        $this->saved = true;
    }
};
?>

<form class="f-card f-stack" wire:submit="save" aria-label="Mail preferences">
    <h2>Mail preferences</h2>
    <x-fruit::switch wire:model="previews">Show message previews</x-fruit::switch>
    <x-fruit::switch wire:model="sounds">Play a sound for new messages</x-fruit::switch>
    <p class="f-help">These example preferences are saved in your current session.</p>
    <div class="f-row">
        <x-fruit::button type="submit" variant="primary" wire:loading.attr="disabled" wire:target="save">Save changes</x-fruit::button>
        <span role="status">@if($saved) Changes saved. @endif</span>
    </div>
</form>
