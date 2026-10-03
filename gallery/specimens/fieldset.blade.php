<x-fruit::fieldset>
    <legend>Delivery preferences</legend>
    <div class="f-stack">
        <x-fruit::checkbox name="delivery[]" value="email" checked>Email updates</x-fruit::checkbox>
        <x-fruit::checkbox name="delivery[]" value="push">Push notifications</x-fruit::checkbox>
    </div>
</x-fruit::fieldset>
