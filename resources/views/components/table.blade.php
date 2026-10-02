@php(\FruitUI\Support\ComponentContract::semantics('table', $attributes, 'table'))
<table {{ $attributes->class(['f-table']) }}>
    {{ $slot }}
</table>
