<?php

namespace FruitUI\Tests;

use Illuminate\Support\Facades\Blade;
use PHPUnit\Framework\Attributes\DataProvider;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class ComponentContractsTest extends TestCase
{
    #[DataProvider('textTypes')]
    public function test_text_input_accepts_only_documented_subtypes(string $type): void
    {
        $html = Blade::render('<x-fruit::input :type="$type" name="message" value="Hello" aria-label="Message" x-model="message" wire:model.live="message" />', compact('type'));
        $input = $this->document($html)->getElementsByTagName('input')->item(0);
        $this->assertSame($type, $input->getAttribute('type'));
        $this->assertSame('message', $input->getAttribute('name'));
        $this->assertSame('Hello', $input->getAttribute('value'));
        $this->assertSame('message', $input->getAttribute('x-model'));
        $this->assertSame('message', $input->getAttribute('wire:model.live'));
    }

    public static function textTypes(): array
    {
        return array_map(fn ($type) => [$type], ['text', 'email', 'password', 'search', 'tel', 'url']);
    }

    #[DataProvider('invalidTypes')]
    public function test_other_control_families_cannot_be_rendered_as_text_input(mixed $type): void
    {
        $this->assertRejected('<x-fruit::input :type="$type" />', 'Use checkbox, radio, or switch', compact('type'));
    }

    public static function invalidTypes(): array
    {
        return array_map(fn ($type) => [$type], ['checkbox', 'radio', 'number', 'range', 'date', 'file', 'hidden', 'button', 'unknown', false, ['text']]);
    }

    #[DataProvider('buttonVariants')]
    public function test_supported_button_variants_keep_the_same_native_contract(string $variant): void
    {
        $html = Blade::render('<x-fruit::button :variant="$variant" type="submit" name="action" value="save" wire:click="save">Save</x-fruit::button>', compact('variant'));
        $button = $this->document($html)->getElementsByTagName('button')->item(0);
        $this->assertSame('submit', $button->getAttribute('type'));
        $this->assertSame('save', $button->getAttribute('value'));
        $this->assertSame('save', $button->getAttribute('wire:click'));
        $this->assertStringContainsString('f-button', $button->getAttribute('class'));
        if ($variant !== 'default') {
            $this->assertStringContainsString('f-button--'.$variant, $button->getAttribute('class'));
        }
    }

    public static function buttonVariants(): array
    {
        return array_map(fn ($variant) => [$variant], ['default', 'primary', 'ghost', 'danger']);
    }

    #[DataProvider('choices')]
    public function test_choice_components_own_their_control_and_forward_form_and_adapter_attributes(string $component, string $type): void
    {
        $html = Blade::render('<x-fruit::'.$component.' type="'.$type.'" role="'.$component.'" id="choice" name="choice" value="compact" checked disabled required x-model="choice" wire:model.live="choice" aria-describedby="choice-help">Compact</x-fruit::'.$component.'>');
        $document = $this->document($html);
        $input = $document->getElementsByTagName('input')->item(0);
        $this->assertSame($type, $input->getAttribute('type'));
        $this->assertSame($component, $input->getAttribute('role'));
        $this->assertSame('label', $input->parentNode->nodeName);
        $this->assertSame('Compact', trim($input->parentNode->textContent));
        foreach (['id' => 'choice', 'name' => 'choice', 'value' => 'compact', 'x-model' => 'choice', 'wire:model.live' => 'choice', 'aria-describedby' => 'choice-help'] as $attribute => $value) {
            $this->assertSame($value, $input->getAttribute($attribute));
            $this->assertFalse($input->parentNode->hasAttribute($attribute));
        }
        foreach (['checked', 'disabled', 'required'] as $attribute) {
            $this->assertTrue($input->hasAttribute($attribute));
        }
        $this->assertSame(1, preg_match_all('/\btype="/', $html));
        $this->assertSame(1, preg_match_all('/\brole="/', $html));
    }

    public static function choices(): array
    {
        return [['checkbox', 'checkbox'], ['radio', 'radio'], ['switch', 'checkbox']];
    }

    #[DataProvider('invalidContracts')]
    public function test_options_and_attributes_cannot_change_a_components_semantic_purpose(string $template, string $message): void
    {
        $this->assertRejected($template, $message);
    }

    public static function invalidContracts(): array
    {
        return [
            ['<x-fruit::button variant="red">Go</x-fruit::button>', 'button variant must be one of'],
            ['<x-fruit::button type="checkbox">Go</x-fruit::button>', 'button type must be one of'],
            ['<x-fruit::button role="checkbox">Go</x-fruit::button>', 'overriding role'],
            ['<x-fruit::input role="checkbox" />', 'overriding role'],
            ['<x-fruit::input as="select" />', 'fixed native element'],
            ['<x-fruit::input x-bind:type="kind" />', 'type and role belong to its component contract'],
            ['<x-fruit::input ::type="kind" />', 'type and role belong to its component contract'],
            ['<x-fruit::input type="email" x-bind:type="kind" />', 'type and role belong to its component contract'],
            ['<x-fruit::checkbox type="radio">Choice</x-fruit::checkbox>', 'fixed native type'],
            ['<x-fruit::radio role="checkbox">Choice</x-fruit::radio>', 'overriding role'],
            ['<x-fruit::switch role="checkbox">Setting</x-fruit::switch>', 'overriding role'],
            ['<x-fruit::switch x-bind:role.camel="kind">Setting</x-fruit::switch>', 'type and role belong to its component contract'],
            ['<x-fruit::select role="checkbox"><option>A</option></x-fruit::select>', 'overriding role'],
            ['<x-fruit::textarea role="listbox" />', 'overriding role'],
            ['<x-fruit::dialog role="checkbox" />', 'overriding role'],
            ['<x-fruit::disclosure title="More" as="button">Details</x-fruit::disclosure>', 'fixed native element'],
            ['<x-fruit::card role="checkbox">A row</x-fruit::card>', 'overriding role'],
            ['<x-fruit::card as="button">An action</x-fruit::card>', 'fixed native element'],
        ];
    }

    public function test_a_password_input_can_bind_its_type_to_reveal_its_characters(): void
    {
        // Blade escapes ::type to Alpine's :type shorthand.
        foreach (['x-bind:type' => 'x-bind:type', '::type' => ':type'] as $binding => $rendered) {
            $html = Blade::render('<x-fruit::input type="password" name="password" autocomplete="current-password" '.$binding.'="shown ? \'text\' : \'password\'" wire:model="password" />');
            $input = $this->document($html)->getElementsByTagName('input')->item(0);

            $this->assertSame('password', $input->getAttribute('type'));
            $this->assertSame("shown ? 'text' : 'password'", $input->getAttribute($rendered));
            $this->assertSame('password', $input->getAttribute('wire:model'));
        }

        // The documented reveal toggle: Field still labels the input inside an input group.
        $html = Blade::render(<<<'BLADE'
            <x-fruit::field label="Password" x-data="{ shown: false }">
                <div class="f-input-group">
                    <x-fruit::input type="password" wire:model="password" autocomplete="current-password" x-bind:type="shown ? 'text' : 'password'" />
                    <x-fruit::button type="button" x-on:click="shown = !shown" x-bind:aria-pressed="shown">Show</x-fruit::button>
                </div>
            </x-fruit::field>
            BLADE);
        $input = $this->document($html)->getElementsByTagName('input')->item(0);
        $this->assertSame('field-password', $input->getAttribute('id'));
        $this->assertStringContainsString('for="field-password"', $html);
    }

    public function test_a_card_can_group_a_choice_without_owning_its_interaction(): void
    {
        $html = Blade::render('<x-fruit::card role="group" aria-label="Notification settings"><x-fruit::checkbox name="sounds" value="1" checked>Play a sound</x-fruit::checkbox></x-fruit::card>');
        $document = $this->document($html);
        $card = $document->getElementsByTagName('section')->item(0);
        $choice = $document->getElementsByTagName('input')->item(0);
        $this->assertSame('group', $card->getAttribute('role'));
        $this->assertFalse($card->hasAttribute('checked'));
        $this->assertFalse($card->hasAttribute('value'));
        $this->assertSame('checkbox', $choice->getAttribute('role'));
        $this->assertSame('sounds', $choice->getAttribute('name'));
        $this->assertTrue($choice->hasAttribute('checked'));
    }

    public function test_every_blade_component_has_a_complete_documented_contract(): void
    {
        $root = dirname(__DIR__, 2);
        $views = $root.'/resources/views/components';
        $components = [];
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($views)) as $file) {
            if ($file->isFile() && str_ends_with($file->getFilename(), '.blade.php')) {
                $name = substr($file->getPathname(), strlen($views) + 1, -strlen('.blade.php'));
                $components[] = str_replace(DIRECTORY_SEPARATOR, '.', $name);
            }
        }

        $catalog = json_decode(file_get_contents($root.'/docs/component-catalog.json'), true, flags: JSON_THROW_ON_ERROR);
        $documented = [];
        foreach ($catalog as $entry) {
            foreach ($entry['contracts'] ?? [] as $name => $contract) {
                foreach (['purpose', 'element', 'state', 'keyboard', 'options'] as $field) {
                    $this->assertNotSame('', trim($contract[$field] ?? ''), "Document {$field} for {$name}");
                }
                $this->assertContains($name, $entry['blade'], "{$name}'s contract belongs to the entry that lists its adapter");
                $documented[] = $name;
            }
        }
        sort($components);
        sort($documented);
        $this->assertSame($components, $documented, 'Adding or removing a Blade component must update the contract catalog.');
    }

    #[DataProvider('nativeInputFamilies')]
    public function test_native_input_families_forward_attributes_to_the_actual_control(string $component, string $type): void
    {
        $html = Blade::render('<x-fruit::'.$component.' type="'.$type.'" id="field" name="field" min="1" max="10" step="1" required disabled aria-label="Field" x-model="field" wire:model.live="field" @change="changed" />');
        $document = $this->document($html);
        $this->assertSame(1, $document->getElementsByTagName('input')->length);
        $input = $document->getElementsByTagName('input')->item(0);
        foreach (['type' => $type, 'id' => 'field', 'name' => 'field', 'min' => '1', 'max' => '10', 'step' => '1', 'aria-label' => 'Field', 'x-model' => 'field', 'wire:model.live' => 'field'] as $name => $value) {
            $this->assertSame($value, $input->getAttribute($name));
        }
        // Older libxml HTML parsers discard Alpine's @ shorthand. Check the emitted control.
        $this->assertMatchesRegularExpression('/<input\b[^>]*\s@change="changed"[^>]*>/s', $html);
        $this->assertTrue($input->hasAttribute('required'));
        $this->assertTrue($input->hasAttribute('disabled'));
        $this->assertSame(1, preg_match_all('/\btype="/', $html));
    }

    public static function nativeInputFamilies(): array
    {
        return [['file', 'file'], ['number', 'number'], ['date', 'date'], ['date', 'datetime-local'], ['date', 'month'], ['date', 'week'], ['time', 'time'], ['color', 'color'], ['range', 'range']];
    }

    public function test_file_list_and_readonly_numeric_contracts_keep_native_attributes(): void
    {
        $file = $this->document(Blade::render('<x-fruit::file name="attachments[]" accept=".csv" multiple wire:model="attachments" />'))->getElementsByTagName('input')->item(0);
        $this->assertSame('attachments[]', $file->getAttribute('name'));
        $this->assertSame('.csv', $file->getAttribute('accept'));
        $this->assertTrue($file->hasAttribute('multiple'));
        $this->assertFalse($file->hasAttribute('value'));
        $number = $this->document(Blade::render('<x-fruit::number name="seats" value="12" readonly />'))->getElementsByTagName('input')->item(0);
        $this->assertSame('12', $number->getAttribute('value'));
        $this->assertTrue($number->hasAttribute('readonly'));
    }

    #[DataProvider('newSemanticOverrides')]
    public function test_new_controls_reject_changes_to_their_semantic_contract(string $template, string $message): void
    {
        $this->assertRejected($template, $message);
    }

    public static function newSemanticOverrides(): array
    {
        $cases = [];
        foreach (['file', 'number', 'date', 'time', 'color', 'range', 'progress', 'meter', 'fieldset'] as $component) {
            $cases[] = ['<x-fruit::'.$component.' role="checkbox" />', 'overriding role'];
            $cases[] = ['<x-fruit::'.$component.' x-bind:type.camel="kind" />', 'type and role belong'];
            $cases[] = ['<x-fruit::'.$component.' as="button" />', 'fixed native element'];
        }
        foreach (['file', 'number', 'time', 'color', 'range'] as $component) {
            $cases[] = ['<x-fruit::'.$component.' type="text" />', 'fixed native type'];
        }
        foreach (['time', 'text', 'file', 'unknown'] as $type) {
            $cases[] = ['<x-fruit::date type="'.$type.'" />', 'date type must be one of'];
        }

        return $cases;
    }

    public function test_fieldset_and_indicators_preserve_grouping_and_native_value_models(): void
    {
        $html = Blade::render('<x-fruit::fieldset disabled name="preferences"><legend>Preferences</legend><x-fruit::checkbox name="email" value="1">Email</x-fruit::checkbox></x-fruit::fieldset><x-fruit::progress aria-label="Importing" value="4" max="10">4 of 10</x-fruit::progress><x-fruit::progress aria-label="Connecting" /><x-fruit::meter aria-label="Storage" min="0" max="100" low="60" high="85" optimum="20" value="35" />');
        $document = $this->document($html);
        $group = $document->getElementsByTagName('fieldset')->item(0);
        $this->assertTrue($group->hasAttribute('disabled'));
        $this->assertSame('legend', $group->firstChild->nodeName);
        $this->assertSame('Preferences', $group->firstChild->textContent);
        $this->assertSame('checkbox', $group->getElementsByTagName('input')->item(0)->getAttribute('type'));
        $progress = $document->getElementsByTagName('progress');
        $this->assertSame('4', $progress->item(0)->getAttribute('value'));
        $this->assertSame('10', $progress->item(0)->getAttribute('max'));
        $this->assertFalse($progress->item(1)->hasAttribute('value'));
        $this->assertFalse($progress->item(1)->hasAttribute('aria-valuenow'));
        $meter = $document->getElementsByTagName('meter')->item(0);
        foreach (['min' => '0', 'max' => '100', 'low' => '60', 'high' => '85', 'optimum' => '20', 'value' => '35'] as $name => $value) {
            $this->assertSame($value, $meter->getAttribute($name));
        }
    }
}
