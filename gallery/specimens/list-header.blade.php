{{-- Cmd/Ctrl+click, Shift+click or Shift+arrows select rows; Select shows the checkboxes. While rows are
     selected the selection bar takes the tools' place in the same row. --}}
<div x-data="{ selected: [] }">
    <x-fruit::list-header>
        <span>Newest First</span>
        <span class="f-toolbar__spacer"></span>
        <x-fruit::button variant="ghost" size="small" data-fruit-select-toggle aria-controls="gallery-selectable" aria-pressed="false">Select</x-fruit::button>
        <x-slot:selection>
            <x-fruit::selection-bar :count="0" x-bind:data-count="selected.length" aria-label="Selected conversations">
                <x-fruit::button variant="ghost" class="f-button--icon" aria-label="Archive selected" title="Archive selected"><svg class="f-icon" aria-hidden="true"><use href="#i-archive"/></svg></x-fruit::button>
                <x-fruit::menu title="More actions for selected conversations">
                    <x-slot:trigger class="f-button--ghost f-button--icon" aria-label="More" title="More"><svg class="f-icon" aria-hidden="true"><use href="#i-more"/></svg></x-slot:trigger>
                    <x-fruit::menu-item>Mark as Unread</x-fruit::menu-item>
                    <x-fruit::menu-item>Move to Waiting</x-fruit::menu-item>
                </x-fruit::menu>
                <x-fruit::button variant="ghost" class="f-button--icon" x-on:click="selected = []" aria-label="Clear Selection" title="Clear Selection"><svg class="f-icon" aria-hidden="true"><use href="#i-close"/></svg></x-fruit::button>
            </x-fruit::selection-bar>
        </x-slot:selection>
    </x-fruit::list-header>
    <x-fruit::item-list id="gallery-selectable" selection="multiple" aria-label="Selectable conversations">
        @foreach (['1042' => 'Sophie Chen', '1041' => 'Jordan Lee', '1040' => 'Emma Thompson', '1039' => 'Daniel Brooks'] as $id => $name)
            <li>
                <x-fruit::checkbox name="selected[]" value="{{ $id }}" x-model="selected"><span class="f-sr-only">Select {{ $name }}</span></x-fruit::checkbox>
                <x-fruit::item-row :aria-current="(string) $id === '1042' ? 'true' : null">{{ $name }}<x-slot:subtitle>Conversation #{{ $id }}</x-slot:subtitle></x-fruit::item-row>
            </li>
        @endforeach
    </x-fruit::item-list>
</div>
