<form class="f-stack" id="token-example" x-data="{ recipients: 'sophie@example.com' }" @submit.prevent>
    <label class="f-label" for="gallery-recipients">Recipients</label>
    <x-fruit::token-field id="gallery-recipients" name="recipients" x-model="recipients" required placeholder="Add a recipient"
        @fruit-token-add="if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($event.detail.value)) { $event.detail.error = 'Enter an email address.'; $event.preventDefault(); }">sophie@example.com</x-fruit::token-field>
    <p class="f-help">Enter or comma to add. Backspace in the empty field focuses the last remove button.</p>
    <div class="f-row">
        <x-fruit::button @click="recipients = 'mia@example.com'">Set recipients externally</x-fruit::button>
        <x-fruit::button type="reset">Reset recipients</x-fruit::button>
    </div>
</form>
