@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@php(\FruitUI\Support\ComponentContract::validate('file', $attributes))
<input type="file" {{ $attributes->except('type')->class(['f-input f-file']) }}>
