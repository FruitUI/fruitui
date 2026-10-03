<div class="f-stack" x-data="{ sort: 'date', previews: true }">
    <x-fruit::menu title="View options">
        <x-slot:trigger>View</x-slot:trigger>
        <x-fruit::menu-group label="Sort by">
            <x-fruit::menu-radio x-bind:aria-checked="String(sort === 'date')" @click="sort = 'date'">Date</x-fruit::menu-radio>
            <x-fruit::menu-radio x-bind:aria-checked="String(sort === 'sender')" @click="sort = 'sender'">Sender</x-fruit::menu-radio>
        </x-fruit::menu-group>
        <x-fruit::menu-separator />
        <x-fruit::menu-checkbox x-bind:aria-checked="String(previews)" @click="previews = !previews" shortcut="⌥⌘P">Show previews</x-fruit::menu-checkbox>
        <x-fruit::menu-item wire:click="refresh" shortcut="⌘R">Refresh</x-fruit::menu-item>
        <x-fruit::menu-separator />
        <x-fruit::menu-link href="/support.html">Open Support</x-fruit::menu-link>
    </x-fruit::menu>
    <p class="f-help" x-text="'Sorted by ' + sort + (previews ? ', with previews' : ', without previews')"></p>
</div>
