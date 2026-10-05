<x-fruit::floating-disclosure x-data="fruitFloatingDisclosure">
    <x-slot:trigger class="f-button">Preview Options</x-slot:trigger>
    <x-slot:content class="f-stack">
        <x-fruit::button variant="ghost" @click="close(true)">Show All Messages</x-fruit::button>
        <x-fruit::button variant="ghost" @click="close(true)">Show Unread</x-fruit::button>
    </x-slot:content>
</x-fruit::floating-disclosure>
