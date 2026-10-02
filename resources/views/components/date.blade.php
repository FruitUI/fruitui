@props(['type' => 'date'])
@php(\FruitUI\Support\ComponentContract::date($type, $attributes))
<input type="{{ $type }}" {{ $attributes->except('type')->class(['f-input']) }}>
