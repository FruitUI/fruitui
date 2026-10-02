@props(['title' => 'Actions'])
@php(\FruitUI\Support\ComponentContract::menu($attributes))
@php($triggerAttributes = isset($trigger) ? $trigger->attributes : new \Illuminate\View\ComponentAttributeBag())
@php(\FruitUI\Support\ComponentContract::semantics('menu-trigger', $triggerAttributes, 'button'))
<details x-data="fruitMenu" {{ $attributes->class(['f-menu']) }}>
    <summary role="button" {{ $triggerAttributes->except(['role', 'aria-haspopup'])->class(['f-button']) }} aria-haspopup="menu">{{ $trigger ?? $title }}</summary>
    <div class="f-menu__items" role="menu" aria-label="{{ $title }}">{{ $slot }}</div>
</details>
