<div class="f-stack">
    <x-fruit::field label="Webhook Secret" description="Paste it into your app’s webhook settings.">
        <div class="f-input-group">
            <x-fruit::input id="gallery-webhook-secret" value="whsec_7f3a91c2b8" readonly />
            <x-fruit::copy-button value="whsec_7f3a91c2b8" aria-label="Copy webhook secret" />
        </div>
    </x-fruit::field>
    <div class="f-row">
        <x-fruit::copy-button value="https://forma.example/invite/7f3a">Copy Invite Link</x-fruit::copy-button>
        <x-fruit::copy-button value="#1042" variant="ghost" size="small">Copy Number</x-fruit::copy-button>
    </div>
</div>
