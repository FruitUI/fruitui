@php(\FruitUI\Support\ComponentContract::semantics('pagination', $attributes, 'navigation'))
<nav {{ $attributes->class(['f-pagination'])->merge(['aria-label' => 'Pagination']) }}>{{ $slot }}</nav>
