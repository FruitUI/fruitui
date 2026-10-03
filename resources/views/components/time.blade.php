@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@php(\FruitUI\Support\ComponentContract::validate('time', $attributes))
<input type="time" {{ $attributes->except('type')->class(['f-input']) }}>
