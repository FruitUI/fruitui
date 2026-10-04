<x-fruit::thread aria-label="Conversation history">
    <li>
        <x-fruit::message-event datetime="2026-10-02T10:45">
            Mia Patel assigned this to Alex Morgan
            <x-slot:icon><svg class="f-icon"><use href="#i-person"/></svg></x-slot:icon>
            <x-slot:time>10:45 AM</x-slot:time>
            <x-slot:actions>
                <x-fruit::menu title="More actions for this event">
                    <x-slot:trigger class="f-button--ghost f-button--icon" aria-label="More actions"><svg class="f-icon" aria-hidden="true"><use href="#i-more"/></svg></x-slot:trigger>
                    <x-fruit::menu-item>Outgoing emails</x-fruit::menu-item>
                </x-fruit::menu>
            </x-slot:actions>
        </x-fruit::message-event>
    </li>
    <li>
        <x-fruit::message-event datetime="2026-10-02T11:02">
            Alex Morgan changed the status to Pending
            <x-slot:icon><svg class="f-icon"><use href="#i-clock"/></svg></x-slot:icon>
            <x-slot:time>11:02 AM</x-slot:time>
        </x-fruit::message-event>
    </li>
</x-fruit::thread>
