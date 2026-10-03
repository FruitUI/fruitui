<?php

namespace FruitUI\Livewire;

/**
 * Server-side feedback for Livewire components.
 *
 * Events reach `x-fruit::toaster` and named `x-fruit::dialog` elements in the
 * browser. The methods are protected so they are not callable as client actions.
 */
trait WithFruitUI
{
    protected function toast(string $message): void
    {
        $this->dispatch('fruit-toast', message: $message);
    }

    protected function openDialog(string $name): void
    {
        $this->dispatch('fruit-dialog-open', name: $name);
    }

    protected function closeDialog(string $name): void
    {
        $this->dispatch('fruit-dialog-close', name: $name);
    }

    /** Show a toast on the next page, after a redirect. */
    protected function flashToast(string $message): void
    {
        session()->flash('fruit-toast', $message);
    }
}
