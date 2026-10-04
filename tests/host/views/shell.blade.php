<!doctype html><html class="fruit-ui" lang="en"><head><title>FruitUI app shell</title>
<link rel="stylesheet" href="http://127.0.0.1:5173/src/fruitui.css">
<script type="module" src="http://127.0.0.1:5173/src/js/livewire.js"></script></head><body>
{{-- An application shell: the sidebar persists across wire:navigate; Livewire marks the current link. --}}
<x-fruit::workspace aria-label="App shell" style="--f-workspace-columns: 220px minmax(0, 1fr); --f-workspace-height: 600px">
    @persist('sidebar')
        <x-fruit::sidebar class="f-pane f-pane--column" aria-label="App">
            <x-fruit::sidebar-item :href="url('/shell/inbox')" :current="$page === 'inbox'" wire:navigate>Inbox</x-fruit::sidebar-item>
            <x-fruit::sidebar-item :href="url('/shell/preferences')" :current="$page === 'preferences'" wire:navigate>Preferences</x-fruit::sidebar-item>
        </x-fruit::sidebar>
    @endpersist
    <x-fruit::pane class="f-pane--scroll" style="--f-pane-scroll-padding: var(--f-space-4)">
        @if ($page === 'preferences')
            <livewire:fruit-mail-preferences />
        @else
            <h1>Inbox</h1>
        @endif
    </x-fruit::pane>
</x-fruit::workspace>
<x-fruit::toaster />
<x-fruit::confirmer />
</body></html>
