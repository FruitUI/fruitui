<div class="f-row" x-data="{ visible: true }">
    <x-fruit::chip x-show="visible">
        Billing
        <x-slot:remove @click="visible = false">Remove Billing</x-slot:remove>
    </x-fruit::chip>
    <x-fruit::chip>Team Plan</x-fruit::chip>
</div>
