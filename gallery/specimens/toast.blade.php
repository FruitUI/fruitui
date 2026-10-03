{{-- One toaster per layout. The server calls Fruit::toast('…'); Alpine code calls $toast('…'). --}}
<x-fruit::button @click="$toast('Conversation archived.')">Show toast</x-fruit::button>
<x-fruit::toaster />
{{-- How the toast looks, for this page: --}}
<div class="f-toast gallery-toast" aria-hidden="true">Conversation archived.</div>
