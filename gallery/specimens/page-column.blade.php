{{-- A page's content column, centered in its pane: title, description and actions, the content, and a
     save bar that stays in view, all one width. width: narrow (forms, settings), medium, wide (tables). --}}
<div style="max-height: 420px; overflow: auto; border: 1px solid var(--f-border); border-radius: var(--f-radius); background: var(--f-grouped-background)">
    <x-fruit::page width="narrow" title="Notifications" description="Choose what reaches you, and where." :level="3" style="--f-page-background: var(--f-grouped-background)">
        <x-slot:actions><x-fruit::button variant="ghost" size="small">Restore defaults</x-fruit::button></x-slot:actions>
        <x-fruit::form-section title="Email">
            <x-fruit::field label="New conversations" layout="row"><x-fruit::switch name="notify_new" checked /></x-fruit::field>
            <x-fruit::field label="Replies to my conversations" layout="row"><x-fruit::switch name="notify_replies" checked /></x-fruit::field>
            <x-fruit::field label="Mentions" layout="row"><x-fruit::switch name="notify_mentions" /></x-fruit::field>
        </x-fruit::form-section>
        <x-fruit::form-section title="Desktop">
            <x-fruit::field label="Show previews" layout="row"><x-fruit::switch name="notify_previews" /></x-fruit::field>
        </x-fruit::form-section>
        <x-slot:footer>
            <p class="f-help" role="status">All changes saved.</p>
            <x-fruit::button>Revert</x-fruit::button>
            <x-fruit::button variant="primary">Save</x-fruit::button>
        </x-slot:footer>
    </x-fruit::page>
</div>
