<div style="padding: 16px; border-radius: var(--f-radius); background: var(--f-grouped-background)">
    <x-fruit::form-section title="Customers" footer="Customers see these changes the next time they write.">
        <x-fruit::field label="Company Name" layout="row">
            <x-fruit::input name="company" value="Forma" />
        </x-fruit::field>
        <x-fruit::field label="Customer Photos" layout="row" description="From Gravatar, for customers without a photo.">
            <x-fruit::switch name="photos" value="1" checked />
        </x-fruit::field>
        <x-fruit::fieldset>
            <legend>Users can</legend>
            <x-fruit::checkbox name="permissions[]" value="tags" checked>Manage tags</x-fruit::checkbox>
            <x-fruit::checkbox name="permissions[]" value="folders">Manage custom folders</x-fruit::checkbox>
        </x-fruit::fieldset>
        {{-- A row that opens a sub-page, with its current value: a link, as settings drill down. --}}
        <a class="f-form-row f-form-row--link" href="#component-form-section"><span>Connection</span><span class="f-form-row__value">SMTP · smtp.forma.example</span></a>
        <div class="f-form-row">
            <div>
                <strong class="f-headline">Delete Mailbox</strong>
                <p class="f-help">Removes the mailbox for everyone.</p>
            </div>
            <x-fruit::button variant="danger">Delete Mailbox…</x-fruit::button>
        </div>
    </x-fruit::form-section>
</div>
