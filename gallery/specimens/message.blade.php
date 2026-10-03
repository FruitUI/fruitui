<div class="f-stack">
    <x-fruit::message aria-label="Message from Mia Patel" datetime="2026-10-02T09:08">
        <x-slot:avatar><x-fruit::avatar>MP</x-fruit::avatar></x-slot:avatar>
        <x-slot:author>Mia Patel</x-slot:author>
        <x-slot:time>9:08 AM</x-slot:time>
        A little space for the things we’re making. Early ideas, tiny details, and anything that makes an interface feel more human.
        <x-slot:footer><x-fruit::button size="small" variant="ghost">Reply in thread</x-fruit::button></x-slot:footer>
    </x-fruit::message>
    <x-fruit::message layout="stacked" aria-label="Customer message">
        <x-slot:avatar><x-fruit::avatar>SC</x-fruit::avatar></x-slot:avatar>
        <x-slot:author>Sophie Chen</x-slot:author>
        <x-slot:meta>Customer</x-slot:meta>
        <x-slot:time>Today, 10:42 AM</x-slot:time>
        We’re growing the studio. Can we move to the Team plan without losing our projects?
    </x-fruit::message>
    <x-fruit::message layout="stacked" variant="note" aria-label="Internal note">
        <x-slot:author>Mia Patel</x-slot:author>
        <x-slot:meta>Internal note · Only your team</x-slot:meta>
        Existing projects stay in place when upgrading.
    </x-fruit::message>
</div>
