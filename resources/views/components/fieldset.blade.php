@php(\FruitUI\Support\ComponentContract::semantics('fieldset', $attributes, 'group'))
<fieldset {{ $attributes->class(['f-fieldset']) }}>{{ $slot }}</fieldset>
