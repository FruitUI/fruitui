@php(\FruitUI\Support\ComponentContract::validate('badge', $attributes))
<span {{ $attributes->class(['f-badge']) }}>{{ $slot }}</span>
