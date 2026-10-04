<div class="f-stack">
    <x-fruit::message aria-label="Message from Mia Patel" datetime="2026-10-02T09:08">
        <x-slot:avatar><x-fruit::avatar>MP</x-fruit::avatar></x-slot:avatar>
        <x-slot:author>Mia Patel</x-slot:author>
        <x-slot:time>9:08 AM</x-slot:time>
        A little space for the things we’re making. Early ideas, tiny details, and anything that makes an interface feel more human.
        <x-slot:footer><x-fruit::button size="small" variant="ghost">Reply in thread</x-fruit::button></x-slot:footer>
        <x-slot:actions>
            <x-fruit::button variant="ghost" class="f-button--icon" aria-label="Add reaction"><svg class="f-icon" aria-hidden="true"><use href="#i-smile"/></svg></x-fruit::button>
            <x-fruit::button variant="ghost" class="f-button--icon" aria-label="Reply in thread"><svg class="f-icon" aria-hidden="true"><use href="#i-chat"/></svg></x-fruit::button>
        </x-slot:actions>
    </x-fruit::message>
    <x-fruit::message layout="stacked" aria-label="Customer message">
        <x-slot:avatar><x-fruit::avatar>SC</x-fruit::avatar></x-slot:avatar>
        <x-slot:author>Sophie Chen</x-slot:author>
        <x-slot:meta>Customer</x-slot:meta>
        <x-slot:headers>
            <span>To: support@forma.example</span>
            <span>Cc: mia@studio-north.example</span>
        </x-slot:headers>
        <x-slot:time>Today, 10:42 AM</x-slot:time>
        We’re growing the studio. Can we move to the Team plan without losing our projects?
        <x-slot:actions>
            <x-fruit::menu title="More actions for Sophie Chen’s message">
                <x-slot:trigger class="f-button--ghost f-button--icon" aria-label="More actions"><svg class="f-icon" aria-hidden="true"><use href="#i-more"/></svg></x-slot:trigger>
                <x-fruit::menu-item>Show original</x-fruit::menu-item>
                <x-fruit::menu-item>New conversation from here</x-fruit::menu-item>
                <x-fruit::menu-separator />
                <x-fruit::menu-item variant="danger">Delete</x-fruit::menu-item>
            </x-fruit::menu>
        </x-slot:actions>
    </x-fruit::message>
    <x-fruit::message-event datetime="2026-10-02T10:45">
        Mia Patel assigned this to Alex Morgan
        <x-slot:icon><svg class="f-icon"><use href="#i-person"/></svg></x-slot:icon>
        <x-slot:time>10:45 AM</x-slot:time>
    </x-fruit::message-event>
    <x-fruit::message layout="stacked" variant="note" aria-label="Internal note">
        <x-slot:author>Mia Patel</x-slot:author>
        <x-slot:meta>Internal note · Only your team <x-fruit::badge tone="warning">Draft</x-fruit::badge></x-slot:meta>
        Existing projects stay in place when upgrading.
    </x-fruit::message>
</div>
