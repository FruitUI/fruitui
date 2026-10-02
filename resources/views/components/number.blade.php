@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@php(\FruitUI\Support\ComponentContract::semantics('number', $attributes, null, 'number'))
<input type="number" {{ $attributes->except('type')->class(['f-input']) }}>
