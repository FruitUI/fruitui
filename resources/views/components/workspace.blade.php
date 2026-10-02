@php(\FruitUI\Support\ComponentContract::semantics('workspace', $attributes, ['group', 'region']))
<section {{ $attributes->class(['f-workspace']) }}>
    {{ $slot }}
</section>
