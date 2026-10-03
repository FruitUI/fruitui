@php(\FruitUI\Support\ComponentContract::validate('switch', $attributes))
<label class="f-switch">
    <input type="checkbox" role="switch" {{ $attributes->filter(fn ($value, $name) => ! in_array(strtolower($name), ['type', 'role'], true)) }}>
    <span>{{ $slot }}</span>
</label>
