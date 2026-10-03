<div x-data="fruitTabs">
    <x-fruit::tabs aria-label="Conversation information">
        <x-fruit::tab id="gallery-profile-tab" aria-selected="true" aria-controls="gallery-profile-panel">Profile</x-fruit::tab>
        <x-fruit::tab id="gallery-history-tab" aria-selected="false" aria-controls="gallery-history-panel" tabindex="-1">History</x-fruit::tab>
    </x-fruit::tabs>
    <div id="gallery-profile-panel" role="tabpanel" aria-labelledby="gallery-profile-tab" tabindex="0"><p>Sophie Chen · Studio North</p></div>
    <div id="gallery-history-panel" role="tabpanel" aria-labelledby="gallery-history-tab" tabindex="0" hidden><p>Two conversations this month.</p></div>
</div>
