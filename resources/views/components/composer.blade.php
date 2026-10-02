@php(\FruitUI\Support\ComponentContract::semantics('composer', $attributes, 'form'))
<form {{ $attributes->class(['f-composer']) }}>
    {{ $slot }}
</form>
