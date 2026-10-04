<x-fruit::composer aria-label="Composer preview" x-data="{ draft: '', sent: '', copies: false }" @submit.prevent="sent = draft; draft = ''" style="--f-composer-padding: 16px">
    {{-- Mail-style recipient rows: short labels, full-width controls, Cc and Bcc on demand. --}}
    <div>
        <x-fruit::field label="To" layout="inline">
            <x-fruit::input type="email" name="to" value="team@forma.example" />
            <x-fruit::button variant="ghost" size="small" x-show="!copies" aria-controls="gallery-cc-row gallery-bcc-row" aria-expanded="false"
                x-on:click="copies = true; $nextTick(() => document.querySelector('#gallery-cc-row input')?.focus())">Cc/Bcc</x-fruit::button>
        </x-fruit::field>
        <x-fruit::field label="Cc" layout="inline" id="gallery-cc-row" x-show="copies">
            <x-fruit::token-field name="gallery_cc" placeholder="Add a recipient" />
        </x-fruit::field>
        <x-fruit::field label="Bcc" layout="inline" id="gallery-bcc-row" x-show="copies">
            <x-fruit::token-field name="gallery_bcc" placeholder="Add a recipient" />
        </x-fruit::field>
    </div>
    <label class="f-label" for="gallery-compose">Message to the team</label>
    <x-fruit::textarea id="gallery-compose" class="f-composer__input" name="message" rows="3" required x-model="draft" aria-describedby="gallery-compose-help" />
    <footer class="f-composer__footer">
        <span class="f-help" id="gallery-compose-help">Enter inserts a new line.</span>
        <x-fruit::button type="submit" variant="primary">Send preview</x-fruit::button>
    </footer>
    <output class="f-help" x-show="sent" x-text="'Sent: ' + sent" x-cloak></output>
</x-fruit::composer>
