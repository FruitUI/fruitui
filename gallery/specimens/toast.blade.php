{{-- One toaster per layout. The server calls Fruit::toast('…') or Fruit::toast('…', tone: 'danger'); Alpine code calls $toast('…', { tone: 'success' }). --}}
<div class="f-row">
    <x-fruit::button @click="$toast('Conversation archived.')">Show toast</x-fruit::button>
    <x-fruit::button @click="$toast('Settings saved.', { tone: 'success' })">Success</x-fruit::button>
    <x-fruit::button @click="$toast('Could not connect to the IMAP server.', { tone: 'danger' })">Error</x-fruit::button>
</div>
<x-fruit::toaster />
{{-- How the toasts look, for this page: --}}
<div class="f-stack" aria-hidden="true">
    <div class="f-toast gallery-toast">Conversation archived.</div>
    <div class="f-toast gallery-toast" data-tone="success">Settings saved.</div>
    <div class="f-toast gallery-toast" data-tone="danger">Could not connect to the IMAP server.</div>
</div>
