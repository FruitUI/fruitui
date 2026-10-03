<x-fruit::floating-disclosure x-data="fruitFloatingDisclosure">
    <x-slot:trigger class="f-button">Preview options</x-slot:trigger>
    <x-slot:content class="f-stack">
        <x-fruit::button variant="ghost" @click="close(true)">Show all messages</x-fruit::button>
        <x-fruit::button variant="ghost" @click="close(true)">Show unread</x-fruit::button>
    </x-slot:content>
</x-fruit::floating-disclosure>
