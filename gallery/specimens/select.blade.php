<x-fruit::field control-id="default-mailbox" label="Default Mailbox">
    <x-fruit::select name="mailbox">
        <optgroup label="Combined folders">
            <option value="all">All Inboxes</option>
            <option value="flagged">Flagged</option>
            <option value="archive">Archive</option>
        </optgroup>
        <optgroup label="Accounts">
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="offline" disabled>Offline Account</option>
        </optgroup>
    </x-fruit::select>
</x-fruit::field>
<x-fruit::field control-id="included-folders" label="Included Folders">
    <x-fruit::select name="folders[]" multiple size="3">
        <option value="inbox" selected>Inbox</option>
        <option value="sent">Sent</option>
        <option value="archive">Archive</option>
        <option value="junk" disabled>Junk (unavailable)</option>
    </x-fruit::select>
</x-fruit::field>
{{-- control-size="small": as tall as a small button, for a select inline in a row of details. --}}
<dl class="f-description-list">
    <div>
        <dt><label for="customer-language">Language</label></dt>
        <dd><x-fruit::select id="customer-language" name="language" control-size="small" style="width: auto"><option value="en">English</option><option value="nl" selected>Dutch</option><option value="de">German</option></x-fruit::select></dd>
    </div>
    {{-- variant="quiet": the value in the link color until it is opened, for a detail changed now and then. --}}
    <div>
        <dt><label for="reply-language">Replies In</label></dt>
        <dd><x-fruit::select id="reply-language" name="reply_language" variant="quiet"><option value="en">English</option><option value="zh-Hans" selected>Chinese (Simplified)</option><option value="da">Danish</option></x-fruit::select></dd>
    </div>
</dl>
<p class="f-help">Option styling follows your appearance in supporting desktop browsers. Touch devices retain their system picker.</p>
