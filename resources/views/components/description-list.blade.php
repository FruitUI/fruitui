@php(\FruitUI\Support\ComponentContract::semantics('description-list', $attributes, null))
<dl {{ $attributes->class(['f-description-list']) }}>
    {{ $slot }}
</dl>
