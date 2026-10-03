<x-fruit::composer aria-label="Composer preview" x-data="{ draft: '', sent: '' }" @submit.prevent="sent = draft; draft = ''" style="--f-composer-padding: 16px">
    <label class="f-label" for="gallery-compose">Message to the team</label>
    <x-fruit::textarea id="gallery-compose" class="f-composer__input" name="message" rows="3" required x-model="draft" aria-describedby="gallery-compose-help" />
    <footer class="f-composer__footer">
        <span class="f-help" id="gallery-compose-help">Enter inserts a new line.</span>
        <x-fruit::button type="submit" variant="primary">Send preview</x-fruit::button>
    </footer>
    <output class="f-help" x-show="sent" x-text="'Sent: ' + sent" x-cloak></output>
</x-fruit::composer>
