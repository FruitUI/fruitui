{{-- Generated text standing on its own in a thread, such as a summary; the label names it for assistive technology. --}}
<x-fruit::thread aria-label="Conversation history">
    <li>
        {{-- The summary opens to its background: the text is a quiet Disclosure's summary. --}}
        <x-fruit::generated label="Summary">
            Studio North moved to the Team plan with annual billing. One guest invite expired and needs to be sent again.
            <x-slot:details>
                <ul>
                    <li>Sophie asked to move the whole studio to the Team plan and to pay annually.</li>
                    <li>Alex upgraded the plan; three freelancers joined as guests.</li>
                </ul>
            </x-slot:details>
        </x-fruit::generated>
    </li>
    <li>
        <x-fruit::message layout="stacked" aria-label="Customer Message" datetime="2026-10-02T10:42">
            <x-slot:avatar><x-fruit::avatar>SC</x-fruit::avatar></x-slot:avatar>
            <x-slot:author>Sophie Chen</x-slot:author>
            <x-slot:meta>Customer</x-slot:meta>
            <x-slot:time>10:42 AM</x-slot:time>
            Ana says her invite link has expired. Could you send her a fresh one?
        </x-fruit::message>
    </li>
</x-fruit::thread>
