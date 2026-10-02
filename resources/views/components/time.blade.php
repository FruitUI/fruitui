@aware(['fruitField' => null])
@php($attributes = \FruitUI\Support\ComponentContract::fieldControl($attributes, $fruitField))
@php(\FruitUI\Support\ComponentContract::semantics('time', $attributes, null, 'time'))
<input type="time" {{ $attributes->except('type')->class(['f-input']) }}>
