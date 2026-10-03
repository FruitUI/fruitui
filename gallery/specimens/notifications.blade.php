<div>
    <x-fruit::notification-group heading="Today">
        <x-fruit::notification href="/support.html">
            Sophie replied to your conversation
            <x-slot:avatar><x-fruit::avatar>SC</x-fruit::avatar></x-slot:avatar>
            <x-slot:meta>Studio North · 10 minutes ago</x-slot:meta>
            <x-slot:badge>New</x-slot:badge>
        </x-fruit::notification>
    </x-fruit::notification-group>
    <x-fruit::notification-group heading="Yesterday">
        <x-fruit::notification href="/admin.html#/customers">
            Your customer export is ready
            <x-slot:meta>4:15 PM</x-slot:meta>
        </x-fruit::notification>
    </x-fruit::notification-group>
</div>
