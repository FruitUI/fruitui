@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::control('color', $attributes, $fruitField))
<input type="color" {{ $attributes->class(['f-input f-color']) }}>
