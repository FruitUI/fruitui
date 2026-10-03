@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@php(\FruitUI\Support\ComponentContract::validate('color', $attributes))
<input type="color" {{ $attributes->except('type')->class(['f-input f-color']) }}>
