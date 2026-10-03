@props(['type' => 'date'])
@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::control('date', $attributes, $fruitField, ['type' => $type]))
<input type="{{ $type }}" {{ $attributes->class(['f-input']) }}>
