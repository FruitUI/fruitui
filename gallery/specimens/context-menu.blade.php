<x-fruit::item-list aria-label="Conversations with context menus">
    @foreach (['Sophie Chen' => 'A little help with our team plan', 'Jordan Lee' => 'Sign-in after changing our domain'] as $name => $subject)
        <li x-data>
            <x-fruit::item-row @click="$toast('Opened {{ $name }}.')">
                {{ $name }}
                <x-slot:subtitle>{{ $subject }}</x-slot:subtitle>
            </x-fruit::item-row>
            <x-fruit::context-menu title="Conversation actions">
                <x-fruit::menu-item @click="$toast('Marked {{ $name }} as unread.')" shortcut="⇧⌘U">Mark as unread</x-fruit::menu-item>
                <x-fruit::menu-item @click="$toast('Archived {{ $name }}.')">Archive</x-fruit::menu-item>
                <x-fruit::menu-separator />
                <x-fruit::menu-item variant="danger" @click="$toast('Deleted {{ $name }}.')">Delete</x-fruit::menu-item>
            </x-fruit::context-menu>
        </li>
    @endforeach
</x-fruit::item-list>
