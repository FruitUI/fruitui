<x-fruit::item-list aria-label="Sample conversations">
    @foreach (['Sophie Chen' => 'A fresh start for FruitUI', 'Jordan Lee' => 'A little help with our team plan'] as $sender => $subject)
        <li>
            <x-fruit::item-row>
                {{ $sender }}
                <x-slot:trailing>10:42</x-slot:trailing>
                <x-slot:subtitle>{{ $subject }}</x-slot:subtitle>
                <x-slot:preview>A few thoughts on making everyday interfaces feel a little more human.</x-slot:preview>
            </x-fruit::item-row>
        </li>
    @endforeach
</x-fruit::item-list>
