<x-fruit::timeline aria-label="Conversation history">
    @foreach ([['Mia assigned this to Alex', 'From Unassigned', '10:42'], ['Sophie Chen opened the conversation', 'By email', '10:30']] as [$event, $detail, $time])
        <x-fruit::timeline-item datetime="2026-10-02T{{ $time }}">
            {{ $event }}
            <x-slot:icon><svg class="f-icon"><use href="#i-inbox"/></svg></x-slot:icon>
            <x-slot:detail>{{ $detail }}</x-slot:detail>
            <x-slot:time>{{ $time }}</x-slot:time>
        </x-fruit::timeline-item>
    @endforeach
</x-fruit::timeline>
