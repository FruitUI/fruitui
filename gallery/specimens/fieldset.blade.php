<x-fruit::fieldset>
    <legend>Delivery preferences</legend>
    <x-fruit::checkbox name="delivery[]" value="email" checked description="A summary of new conversations each morning.">Email updates</x-fruit::checkbox>
    <x-fruit::checkbox name="delivery[]" value="push">Push notifications</x-fruit::checkbox>
    <x-fruit::switch name="photos" value="1" description="From Gravatar, for customers without a photo.">Customer photos</x-fruit::switch>
</x-fruit::fieldset>
