<div x-data="{ action: 'No action yet' }">
    <x-fruit::menu title="Message actions">
        <x-slot:trigger>More Actions<span class="f-menu__chevron" aria-hidden="true"></span></x-slot:trigger>
        <x-fruit::menu-item @click="action = 'Archived'">Archive</x-fruit::menu-item>
        <x-fruit::menu-item disabled>Forward</x-fruit::menu-item>
        <x-fruit::menu-item @click="action = 'Marked unread'">Mark Unread</x-fruit::menu-item>
        <x-fruit::menu-item variant="danger" @click="action = 'Deleted'">Delete</x-fruit::menu-item>
    </x-fruit::menu>
    <p class="f-help" role="status" x-text="action"></p>
</div>
