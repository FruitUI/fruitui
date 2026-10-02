@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@php(\FruitUI\Support\ComponentContract::semantics('file', $attributes, null, 'file'))
<input type="file" {{ $attributes->except('type')->class(['f-input f-file']) }}>
