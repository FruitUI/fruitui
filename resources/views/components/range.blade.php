@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@php(\FruitUI\Support\ComponentContract::validate('range', $attributes))
<input type="range" {{ $attributes->except('type')->class(['f-range']) }}>
