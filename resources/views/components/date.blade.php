@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@props(['type' => 'date'])
@php(\FruitUI\Support\ComponentContract::validate('date', $attributes, ['type' => $type]))
<input type="{{ $type }}" {{ $attributes->except('type')->class(['f-input']) }}>
