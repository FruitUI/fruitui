<div x-data>
    <x-fruit::button @click="$refs.dialog.showModal()">Open dialog</x-fruit::button>
    <x-fruit::dialog x-ref="dialog" aria-labelledby="dialog-title">
        <header class="f-dialog__header"><h2 id="dialog-title">A moment of focus.</h2></header>
        <div class="f-dialog__body"><p>Good dialogs ask for one thing at a time.</p></div>
        <form class="f-dialog__footer" method="dialog"><x-fruit::button type="submit" variant="primary" autofocus>Got it</x-fruit::button></form>
    </x-fruit::dialog>
</div>
{{-- A named dialog also opens from the server: Fruit::openDialog('archive-confirmation') --}}
<div x-data>
    <x-fruit::button @click="$dispatch('fruit-dialog-open', { name: 'archive-confirmation' })">Open named dialog</x-fruit::button>
</div>
<x-fruit::dialog name="archive-confirmation" aria-labelledby="archive-confirmation-title">
    <header class="f-dialog__header"><h2 id="archive-confirmation-title">Archive this conversation?</h2></header>
    <div class="f-dialog__body"><p>Events open and close this dialog by name.</p></div>
    <footer class="f-dialog__footer" x-data>
        <x-fruit::button variant="primary" @click="$dispatch('fruit-dialog-close', { name: 'archive-confirmation' })">Done</x-fruit::button>
    </footer>
</x-fruit::dialog>
