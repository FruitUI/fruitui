{{-- Pick an accent; the preview follows it. An app sets data-fruit-accent on its root (or html)
     from the saved preference; any element can carry one for a preview. --}}
<div x-data="{ accent: 'blue' }" class="f-stack" x-bind:data-fruit-accent="accent" data-fruit-accent="blue">
    <x-fruit::accent-picker name="gallery_accent" x-model="accent" />
    <div class="f-row">
        <x-fruit::button variant="primary">Send Reply</x-fruit::button>
        <a href="#component-accent-picker">A link in the accent</a>
        <x-fruit::switch name="gallery_accent_switch" checked>Show previews</x-fruit::switch>
    </div>
</div>
