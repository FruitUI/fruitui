{{-- Toast: a status container inside your own fruitToast scope. --}}
<x-fruit::button @click="notify('Conversation archived.')">Show toast</x-fruit::button>
<x-fruit::toast class="gallery-toast" @mouseenter="pauseNotice()" @mouseleave="resumeNotice()" x-text="notice || 'Conversation archived.'" />
{{-- Toaster: one per layout; the server calls Fruit::toast('…') or Fruit::flashToast('…'). --}}
<div x-data>
    <x-fruit::button @click="$dispatch('fruit-toast', { message: 'Sent with a fruit-toast event.' })">Dispatch a toast event</x-fruit::button>
</div>
<x-fruit::toaster />
