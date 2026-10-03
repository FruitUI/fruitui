<x-fruit::field control-id="default-mailbox" label="Default mailbox">
    <x-fruit::select name="mailbox">
        <optgroup label="Combined folders">
            <option value="all">All Inboxes</option>
            <option value="flagged">Flagged</option>
            <option value="archive">Archive</option>
        </optgroup>
        <optgroup label="Accounts">
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="offline" disabled>Offline account</option>
        </optgroup>
    </x-fruit::select>
</x-fruit::field>
<x-fruit::field control-id="included-folders" label="Included folders">
    <x-fruit::select name="folders[]" multiple size="3">
        <option value="inbox" selected>Inbox</option>
        <option value="sent">Sent</option>
        <option value="archive">Archive</option>
        <option value="junk" disabled>Junk (unavailable)</option>
    </x-fruit::select>
</x-fruit::field>
<p class="f-help">Option styling follows your appearance in supporting desktop browsers. Touch devices retain their system picker.</p>
