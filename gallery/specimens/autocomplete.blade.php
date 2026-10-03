<x-fruit::field label="Reply" description="Type @ to mention a teammate, or / for a saved reply.">
    <x-fruit::autocomplete trigger="@">
        <x-fruit::textarea name="gallery_reply" rows="3" />
        <x-slot:options>
            @foreach (['@alex' => 'Alex Morgan', '@mia' => 'Mia Patel', '@noah' => 'Noah Williams'] as $handle => $name)
                <option value="{{ $handle }}">{{ $name }}</option>
            @endforeach
        </x-slot:options>
    </x-fruit::autocomplete>
</x-fruit::field>
<x-fruit::field label="Saved reply">
    <x-fruit::autocomplete trigger="/">
        <x-fruit::input name="gallery_saved" placeholder="Type /thanks" />
        <x-slot:options>
            <option value="Thanks for reaching out! I’m on it.">/thanks</option>
            <option value="Could you send a screenshot of what you see?">/screenshot</option>
        </x-slot:options>
    </x-fruit::autocomplete>
</x-fruit::field>
