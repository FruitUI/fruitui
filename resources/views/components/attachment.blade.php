@php(\FruitUI\Support\ComponentContract::attachment($attributes))
<a {{ $attributes->class(['f-attachment']) }}>
    @isset($leading)<span {{ $leading->attributes->class(['f-attachment__leading']) }}>{{ $leading }}</span>@endisset
    <span class="f-attachment__body">{{ $slot }}@isset($detail)<small {{ $detail->attributes->class(['f-attachment__detail']) }}>{{ $detail }}</small>@endisset</span>
    @isset($trailing)<span {{ $trailing->attributes->class(['f-attachment__trailing']) }}>{{ $trailing }}</span>@endisset
</a>
