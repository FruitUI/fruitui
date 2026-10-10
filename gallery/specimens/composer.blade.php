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
    {{-- The message is written on the composer itself: no box, its text on the composer's edges. --}}
    <label class="f-sr-only" for="gallery-compose">Message to the Team</label>
    <x-fruit::textarea id="gallery-compose" class="f-composer__input" name="message" rows="3" required x-model="draft" placeholder="Message to the Team" aria-describedby="gallery-compose-help" />
    <footer class="f-composer__footer">
        <span class="f-help" id="gallery-compose-help">Enter inserts a new line.</span>
        <x-fruit::button type="submit" variant="primary">Send Preview</x-fruit::button>
    </footer>
    <output class="f-help" x-show="sent" x-text="'Sent: ' + sent" x-cloak></output>
</x-fruit::composer>
{{-- With formatting: an Editor in a composer drops its box too; its icons line up with the text. --}}
<x-fruit::composer aria-label="Reply preview" x-data="{ reply: '', sent: '' }" @submit.prevent="sent = reply; reply = ''" style="--f-composer-padding: 16px">
    <x-fruit::field label="To" layout="inline">
        <x-fruit::input type="email" name="reply_to" value="sophie@example.com" />
    </x-fruit::field>
    <x-fruit::editor id="gallery-compose-reply" name="reply" x-model="reply" aria-label="Reply to Sophie Chen" placeholder="Reply to Sophie Chen" />
    <footer class="f-composer__footer">
        <span class="f-help">From billing@forma.example</span>
        <x-fruit::button type="submit" variant="primary">Send Reply</x-fruit::button>
    </footer>
    <output class="f-help" x-show="sent" x-text="'Sent: ' + sent" x-cloak></output>
</x-fruit::composer>
