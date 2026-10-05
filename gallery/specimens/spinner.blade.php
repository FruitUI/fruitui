{{-- aria-busy (or Livewire's data-loading) alone: after a short delay a spinner covers the label, the
     width holds and further clicks are ignored. With its own spinner, the button shows a label of your choosing. --}}
<div class="f-row" x-data="{ saving: false }">
    <x-fruit::button variant="primary" x-bind:aria-busy="String(saving)" aria-busy="false" x-on:click="saving = true; setTimeout(() => saving = false, 2000)">Save Changes</x-fruit::button>
    <x-fruit::button aria-busy="true">Refresh</x-fruit::button>
    <x-fruit::button variant="ghost" class="f-button--icon" aria-busy="true" aria-label="Sync Mailbox"><svg class="f-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg></x-fruit::button>
    <x-fruit::button aria-busy="true">
        <x-fruit::spinner />
        Saving Changes…
    </x-fruit::button>
</div>
