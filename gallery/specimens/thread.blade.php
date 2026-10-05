{{-- Sent messages carry a bar: the accent for your own (mine), neutral for a teammate's. Notes and
     generated summaries are not sent: a yellow card and a compact indigo one. --}}
<x-fruit::thread aria-label="Conversation history">
    <li>
        <x-fruit::message layout="stacked" aria-label="Customer Message" datetime="2026-10-02T10:42">
            <x-slot:avatar><x-fruit::avatar>SC</x-fruit::avatar></x-slot:avatar>
            <x-slot:author>Sophie Chen</x-slot:author>
            <x-slot:meta>Customer</x-slot:meta>
            <x-slot:time>10:42 AM</x-slot:time>
            Can we move to the Team plan without losing our projects?
        </x-fruit::message>
    </li>
    <li>
        <x-fruit::message layout="stacked" variant="note" aria-label="Internal Note">
            <x-slot:author>Mia Patel</x-slot:author>
            <x-slot:meta>Internal note · Only your team</x-slot:meta>
            Existing projects stay in place when upgrading.
        </x-fruit::message>
    </li>
    <li>
        <x-fruit::message layout="stacked" direction="outgoing" aria-label="Reply from Mia Patel" datetime="2026-10-02T10:51">
            <x-slot:avatar><x-fruit::avatar>MP</x-fruit::avatar></x-slot:avatar>
            <x-slot:author>Mia Patel</x-slot:author>
            <x-slot:meta>Reply to Customer</x-slot:meta>
            <x-slot:time>10:51 AM</x-slot:time>
            Yes. Your projects stay in place, and annual billing is available on the Team plan.
        </x-fruit::message>
    </li>
    <li>
        <x-fruit::message-event datetime="2026-10-02T10:52">
            Mia Patel assigned this to Alex Morgan
            <x-slot:icon><svg class="f-icon"><use href="#i-person"/></svg></x-slot:icon>
            <x-slot:time>10:52 AM</x-slot:time>
        </x-fruit::message-event>
    </li>
    <li>
        <x-fruit::message layout="stacked" aria-label="Customer Message" datetime="2026-10-02T11:20">
            <x-slot:avatar><x-fruit::avatar>SC</x-fruit::avatar></x-slot:avatar>
            <x-slot:author>Sophie Chen</x-slot:author>
            <x-slot:meta>Customer</x-slot:meta>
            <x-slot:time>11:20 AM</x-slot:time>
            Perfect. Could you make the switch for us?
        </x-fruit::message>
    </li>
    <li>
        <x-fruit::message layout="stacked" direction="outgoing" mine aria-label="Your reply" datetime="2026-10-02T11:24">
            <x-slot:avatar><x-fruit::avatar>AM</x-fruit::avatar></x-slot:avatar>
            <x-slot:author>Alex Morgan</x-slot:author>
            <x-slot:meta>Reply to Customer</x-slot:meta>
            <x-slot:time>11:24 AM</x-slot:time>
            All done. Studio North is on the Team plan with annual billing.
        </x-fruit::message>
    </li>
    <li>
        <x-fruit::generated label="Summary">Studio North moved to the Team plan with annual billing.</x-fruit::generated>
    </li>
</x-fruit::thread>
