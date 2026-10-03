@php(\FruitUI\Support\ComponentContract::validate('sidebar', $attributes))
<nav {{ $attributes->class(['f-sidebar']) }}>{{ $slot }}</nav>
