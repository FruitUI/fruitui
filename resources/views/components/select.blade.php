@php(\FruitUI\Support\ComponentContract::semantics('select', $attributes))
<select {{ $attributes->class(['f-input']) }}>{{ $slot }}</select>
