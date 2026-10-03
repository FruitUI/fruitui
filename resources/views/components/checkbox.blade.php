@php(\FruitUI\Support\ComponentContract::validate('checkbox', $attributes))
<label class="f-check">
    <input type="checkbox" role="checkbox" {{ $attributes->filter(fn ($value, $name) => ! in_array(strtolower($name), ['type', 'role'], true)) }}>
    <span>{{ $slot }}</span>
</label>
