@php(\FruitUI\Support\ComponentContract::semantics('color', $attributes, null, 'color'))
<input type="color" {{ $attributes->except('type')->class(['f-input f-color']) }}>
