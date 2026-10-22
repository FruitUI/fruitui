<div x-data="{ action: 'No action yet' }">
    <div class="f-row">
        <x-fruit::menu title="Message actions">
            <x-slot:trigger>More Actions<span class="f-menu__chevron" aria-hidden="true"></span></x-slot:trigger>
            <x-fruit::menu-item @click="action = 'Archived'">Archive</x-fruit::menu-item>
            <x-fruit::menu-item disabled>Forward</x-fruit::menu-item>
            {{-- A link can't take disabled: aria-disabled looks the same and ignores activation. --}}
            <x-fruit::menu-link href="#component-menu" aria-disabled="true">Open in New Tab</x-fruit::menu-link>
            <x-fruit::menu-item @click="action = 'Marked unread'">Mark Unread</x-fruit::menu-item>
            <x-fruit::menu-item variant="danger" @click="action = 'Deleted'">Delete</x-fruit::menu-item>
        </x-fruit::menu>
        <x-fruit::menu title="Assignee">
            {{-- Nor can a summary: aria-disabled on the trigger keeps the menu closed. --}}
            <x-slot:trigger aria-disabled="true">Assignee<span class="f-menu__chevron" aria-hidden="true"></span></x-slot:trigger>
            <x-fruit::menu-item @click="action = 'Assigned'">Assign to Me</x-fruit::menu-item>
        </x-fruit::menu>
    </div>
    <p class="f-help" role="status" x-text="action"></p>
</div>
