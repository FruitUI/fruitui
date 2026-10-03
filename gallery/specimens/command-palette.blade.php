<div x-data>
    <x-fruit::button @click="$dispatch('fruit-dialog-open', { name: 'gallery-commands' })">Open command palette</x-fruit::button>
</div>
<x-fruit::command-palette name="gallery-commands" shortcut="k" label="Go to">
    <x-fruit::command-group label="Examples">
        <x-fruit::command-link href="/">Mail</x-fruit::command-link>
        <x-fruit::command-link href="/support.html">Support</x-fruit::command-link>
        <x-fruit::command-link href="/chat.html">Chat</x-fruit::command-link>
        <x-fruit::command-link href="/admin.html" wire:navigate>Admin</x-fruit::command-link>
    </x-fruit::command-group>
    <x-fruit::command-group label="Actions">
        <x-fruit::command @click="$toast('Command palette works.')" shortcut="⇧⌘T">Show a toast</x-fruit::command>
    </x-fruit::command-group>
</x-fruit::command-palette>
