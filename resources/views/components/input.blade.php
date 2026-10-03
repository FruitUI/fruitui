@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@props(['type' => 'text'])
@php(\FruitUI\Support\ComponentContract::validate('input', $attributes, ['type' => $type]))
<input type="{{ $type }}" {{ $attributes->class(['f-input']) }}>
