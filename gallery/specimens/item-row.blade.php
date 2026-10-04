<div x-data="{ opened: false }" class="f-stack">
    <x-fruit::item-row variant="filled" @click="opened = !opened" ::aria-current="opened ? 'true' : null">
        Sophie Chen
        <x-slot:leading class="f-avatar" aria-hidden="true">SC</x-slot:leading>
        <x-slot:trailing>10:42</x-slot:trailing>
        <x-slot:subtitle>A fresh start for FruitUI</x-slot:subtitle>
        <x-slot:preview>Open this conversation to see its current state.</x-slot:preview>
        <x-slot:meta>Work mailbox</x-slot:meta>
    </x-fruit::item-row>
    <x-fruit::checkbox name="selected-conversation" value="42">Select this conversation for a bulk action</x-fruit::checkbox>
    <p class="f-help" x-text="opened ? 'Conversation open. The checkbox keeps its own value.' : 'Conversation closed.'">Conversation closed.</p>
    <x-fruit::item-row disabled>Unavailable conversation</x-fruit::item-row>
    {{-- A destination row with a leading selection checkbox and a trailing toggle of its own. --}}
    <x-fruit::item-list aria-label="Linked conversations" x-data="{ starred: false }">
        <li>
            <x-fruit::checkbox name="selected[]" value="41"><span class="f-sr-only">Select Jordan Lee</span></x-fruit::checkbox>
            <x-fruit::item-link href="#component-item-row" current>
                Jordan Lee
                <x-slot:trailing>9:30</x-slot:trailing>
                <x-slot:subtitle>Sign-in after changing our domain</x-slot:subtitle>
            </x-fruit::item-link>
            <x-fruit::button variant="ghost" size="small" class="f-button--icon" x-on:click="starred = !starred" x-bind:aria-pressed="String(starred)" aria-pressed="false" aria-label="Star Jordan Lee"><svg class="f-icon" aria-hidden="true"><use href="#i-star"/></svg></x-fruit::button>
        </li>
    </x-fruit::item-list>
</div>
