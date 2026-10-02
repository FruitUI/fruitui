@php(\FruitUI\Support\ComponentContract::semantics('progress', $attributes, 'progressbar'))
<progress {{ $attributes->class(['f-progress']) }}>{{ $slot }}</progress>
