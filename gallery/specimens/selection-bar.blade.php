<div x-data="{ selected: ['1041'] }">
    <x-fruit::item-list aria-label="Selectable conversations">
        @foreach (['1042' => 'Sophie Chen', '1041' => 'Jordan Lee'] as $id => $name)
            <li>
                <x-fruit::checkbox name="selected[]" value="{{ $id }}" :checked="$id === '1041'" x-model="selected"><span class="f-sr-only">Select {{ $name }}</span></x-fruit::checkbox>
                <x-fruit::item-row>{{ $name }}<x-slot:subtitle>Conversation #{{ $id }}</x-slot:subtitle></x-fruit::item-row>
            </li>
        @endforeach
    </x-fruit::item-list>
    {{-- Hidden at zero. Script sets data-count; with Livewire, pass :count="count($selected)" instead. --}}
    <x-fruit::selection-bar :count="1" x-bind:data-count="selected.length" aria-label="Selected conversations">
        <x-fruit::button variant="ghost" size="small" x-on:click="selected = []">Clear selection</x-fruit::button>
        <x-fruit::button size="small">Close selected</x-fruit::button>
    </x-fruit::selection-bar>
</div>
