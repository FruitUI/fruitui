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
</div>
