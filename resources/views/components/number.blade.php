@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@php(\FruitUI\Support\ComponentContract::validate('number', $attributes))
<input type="number" {{ $attributes->except('type')->class(['f-input']) }}>
