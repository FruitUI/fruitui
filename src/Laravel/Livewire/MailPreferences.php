<?php

namespace FruitUI\Livewire;

use Illuminate\Contracts\View\View;
use Livewire\Component;

class MailPreferences extends Component
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

    public function render(): View
    {
        return view('fruit::livewire.mail-preferences');
    }
}
