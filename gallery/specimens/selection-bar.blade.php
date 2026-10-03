<x-fruit::item-list aria-label="Selectable conversations">
    @foreach (['1042' => 'Sophie Chen', '1041' => 'Jordan Lee'] as $id => $name)
        <li>
            <x-fruit::checkbox name="selected[]" value="{{ $id }}" :checked="$id === '1041'" wire:model.live="selected"><span class="f-sr-only">Select {{ $name }}</span></x-fruit::checkbox>
            <x-fruit::item-row wire:click="open({{ $id }})">{{ $name }}<x-slot:subtitle>Conversation #{{ $id }}</x-slot:subtitle></x-fruit::item-row>
        </li>
    @endforeach
</x-fruit::item-list>
{{-- Renders only while items are selected. --}}
<x-fruit::selection-bar :count="1" aria-label="Selected conversations">
    <x-fruit::button variant="ghost" size="small" wire:click="$set('selected', [])">Clear selection</x-fruit::button>
    <x-fruit::button size="small" wire:click="closeSelected">Close selected</x-fruit::button>
</x-fruit::selection-bar>
