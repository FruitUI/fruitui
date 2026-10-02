@props(['type' => 'text'])
@php(\FruitUI\Support\ComponentContract::input($type, $attributes))
<input type="{{ $type }}" {{ $attributes->class(['f-input']) }}>
