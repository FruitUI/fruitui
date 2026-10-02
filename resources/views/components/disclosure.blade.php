@props(['title'])
<details {{ $attributes->class(['f-disclosure']) }}>
    <summary>{{ $title }}</summary>
    <div>{{ $slot }}</div>
</details>
