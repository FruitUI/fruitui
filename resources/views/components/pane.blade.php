@php(\FruitUI\Support\ComponentContract::semantics('pane', $attributes, ['group', 'region']))
<div {{ $attributes->class(['f-pane']) }}>
    {{ $slot }}
</div>
