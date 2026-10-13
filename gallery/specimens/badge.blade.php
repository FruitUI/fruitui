<div class="f-row">
    <x-fruit::badge>Unread</x-fruit::badge>
    <x-fruit::badge>{{ 12 }} conversations</x-fruit::badge>
    <x-fruit::badge variant="outline">Studio Plan</x-fruit::badge>
    {{-- A dot alone, in a count's place: conversations for you, all read. Its text is its name. --}}
    <x-fruit::badge variant="dot">Conversations for you, all read</x-fruit::badge>
</div>
<div class="f-row">
    <x-fruit::badge tone="success">
        <x-slot:dot></x-slot:dot>
        Active
    </x-fruit::badge>
    <x-fruit::badge tone="accent">
        <x-slot:dot></x-slot:dot>
        Trial
    </x-fruit::badge>
    <x-fruit::badge tone="warning">Past Due</x-fruit::badge>
    <x-fruit::badge tone="danger" variant="outline">Urgent</x-fruit::badge>
</div>
