<div style="padding: 16px; border-radius: var(--f-radius); background: var(--f-grouped-background)">
    <x-fruit::form-section title="Customers" footer="Customers see these changes the next time they write.">
        <x-fruit::field label="Company name" layout="row">
            <x-fruit::input name="company" value="Forma" />
        </x-fruit::field>
        <x-fruit::field label="Customer photos" layout="row" description="From Gravatar, for customers without a photo.">
            <x-fruit::switch name="photos" value="1" checked />
        </x-fruit::field>
        <x-fruit::fieldset>
            <legend>Users can</legend>
            <x-fruit::checkbox name="permissions[]" value="tags" checked>Manage tags</x-fruit::checkbox>
            <x-fruit::checkbox name="permissions[]" value="folders">Manage custom folders</x-fruit::checkbox>
        </x-fruit::fieldset>
        <div class="f-form-row">
            <div>
                <strong class="f-headline">Delete mailbox</strong>
                <p class="f-help">Removes the mailbox for everyone.</p>
            </div>
            <x-fruit::button variant="danger">Delete Mailbox…</x-fruit::button>
        </div>
    </x-fruit::form-section>
</div>
