@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@php(\FruitUI\Support\ComponentContract::semantics('range', $attributes, null, 'range'))
<input type="range" {{ $attributes->except('type')->class(['f-range']) }}>
