{{-- One per layout: translated labels for dialogs that FruitUI opens from script or links. --}}
<x-fruit::remote-dialog />
<div class="f-row" x-data>
    {{-- A link opens its href in a dialog; modifier clicks still open it in a new tab. --}}
    <a class="f-button" href="fragments/merge-conversation.html" data-fruit-dialog-url data-fruit-dialog-title="Merge Conversation">Merge Conversation…</a>
    <x-fruit::button x-on:click="$dialog({ title: 'Keyboard Shortcuts', html: document.getElementById('gallery-shortcuts').innerHTML })">Keyboard Shortcuts</x-fruit::button>
    <x-fruit::button x-on:click="$refs.terms.showModal()">Terms (Large, Scrolling)</x-fruit::button>
    {{-- Any dialog can be large and keep its header and footer in view while the body scrolls. --}}
    <x-fruit::dialog size="large" class="f-dialog--scroll" x-ref="terms" aria-labelledby="gallery-terms-title">
        <header class="f-dialog__header"><h2 id="gallery-terms-title">Terms of Service</h2></header>
        <div class="f-dialog__body">
            @foreach (range(1, 12) as $section)
                <p>Section {{ $section }}. These terms describe how a workspace, its members and their conversations are handled, and what each side can expect from the other.</p>
            @endforeach
        </div>
        <form class="f-dialog__footer" method="dialog"><x-fruit::button type="submit" variant="primary">Done</x-fruit::button></form>
    </x-fruit::dialog>
</div>
<template id="gallery-shortcuts">
    <dl class="f-description-list">
        <div><dt>Search</dt><dd><kbd>/</kbd></dd></div>
        <div><dt>Select a Range</dt><dd><kbd>Shift</kbd> + click</dd></div>
        <div><dt>Reply</dt><dd><kbd>R</kbd></dd></div>
    </dl>
</template>
