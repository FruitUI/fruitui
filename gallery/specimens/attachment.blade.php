<x-fruit::attachment href="/attachments/fruitui-design-notes.txt" download>
    FruitUI — design notes.txt
    <x-slot:detail>Text document · 1 KB</x-slot:detail>
    <x-slot:leading><svg class="f-icon" aria-hidden="true"><use href="#i-file"/></svg></x-slot:leading>
    <x-slot:trailing><svg class="f-icon" aria-hidden="true"><use href="#i-download"/></svg></x-slot:trailing>
</x-fruit::attachment>
{{-- An image shows as itself: the thumbnail slot holds an img with alt="", since the name names the link. --}}
<x-fruit::attachment href="/attachments/invite-link-expired.png" download style="margin-top: 12px">
    invite-link-expired.png
    <x-slot:detail>PNG image · 19 KB</x-slot:detail>
    <x-slot:thumbnail><img src="/attachments/invite-link-expired.png" alt="" width="256" height="160" loading="lazy"></x-slot:thumbnail>
    <x-slot:actions><x-fruit::button variant="ghost" class="f-button--icon" aria-label="Remove invite-link-expired.png" title="Remove"><svg class="f-icon" aria-hidden="true"><use href="#i-trash"/></svg></x-fruit::button></x-slot:actions>
</x-fruit::attachment>
