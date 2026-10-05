<x-fruit::fieldset>
    <legend>Delivery Preferences</legend>
    <x-fruit::checkbox name="delivery[]" value="email" checked description="A summary of new conversations each morning.">Email Updates</x-fruit::checkbox>
    <x-fruit::checkbox name="delivery[]" value="push">Push Notifications</x-fruit::checkbox>
    <x-fruit::switch name="photos" value="1" description="From Gravatar, for customers without a photo.">Customer Photos</x-fruit::switch>
</x-fruit::fieldset>
