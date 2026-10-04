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
    <x-fruit::message layout="stacked" aria-label="Customer message from Emma Thompson" lang="da">
        <x-slot:avatar><x-fruit::avatar>ET</x-fruit::avatar></x-slot:avatar>
        <x-slot:author>Emma Thompson</x-slot:author>
        <x-slot:meta>Customer</x-slot:meta>
        <x-slot:time>10:08 AM</x-slot:time>
        Hvad er den nemmeste måde at flytte vores projekter på, så kommentarerne følger med?
        {{-- A machine translation stays with the message it translates. --}}
        <x-slot:translation lang="en">What’s the easiest way to move our projects so the comments come along?</x-slot:translation>
    </x-fruit::message>
    <x-fruit::message layout="stacked" direction="outgoing" mine aria-label="Your reply, not sent" datetime="2026-10-02T10:31">
        <x-slot:avatar><x-fruit::avatar>AM</x-fruit::avatar></x-slot:avatar>
        <x-slot:author>Alex Morgan</x-slot:author>
        <x-slot:meta>You</x-slot:meta>
        <x-slot:time>10:31 AM</x-slot:time>
        {{-- Delivery or state in one quiet line: tone neutral, warning or danger, with small actions. --}}
        <x-slot:status tone="danger">
            Not sent: the mail server refused the connection.
            <x-fruit::button variant="ghost">Retry</x-fruit::button>
            <x-fruit::button variant="ghost">View log</x-fruit::button>
        </x-slot:status>
        The attached notes show where to confirm your new domain.
        <x-slot:attachments>
            <x-fruit::attachment href="attachments/fruitui-design-notes.txt" download>
                sso-setup-notes.txt
                <x-slot:leading><svg class="f-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551"/></svg></x-slot:leading>
                <x-slot:detail>1 KB</x-slot:detail>
                <x-slot:actions>
                    <x-fruit::button variant="ghost" class="f-button--icon" aria-label="Remove sso-setup-notes.txt" title="Remove"><svg class="f-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></x-fruit::button>
                </x-slot:actions>
            </x-fruit::attachment>
        </x-slot:attachments>
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
