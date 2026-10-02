<?php

namespace FruitUI\Tests;

use DOMDocument;
use FruitUI\FruitUIServiceProvider;
use Illuminate\Support\Facades\Blade;
use Illuminate\View\ViewException;
use InvalidArgumentException;
use Orchestra\Testbench\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class ComponentContractsTest extends TestCase
{
    protected function getPackageProviders($app): array
    {
        return [FruitUIServiceProvider::class];
    }

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

        $policy = file_get_contents($root.'/docs/component-policy.md');
        preg_match_all('/^\| `([a-z][a-z0-9.-]*)` \|(.+)\|$/m', $policy, $rows, PREG_SET_ORDER);
        $documented = [];
        foreach ($rows as $row) {
            $cells = array_map('trim', explode('|', trim($row[2])));
            $this->assertCount(5, $cells, 'Document purpose, element/role, state, keyboard, and options/slots for '.$row[1]);
            foreach ($cells as $cell) {
                $this->assertNotSame('', $cell, 'Incomplete contract for '.$row[1]);
            }
            $documented[] = $row[1];
        }
        sort($components);
        sort($documented);
        $this->assertSame($components, $documented, 'Adding or removing a Blade component must update the contract catalog.');
    }

    private function assertRejected(string $template, string $message, array $data = []): void
    {
        try {
            Blade::render($template, $data);
        } catch (ViewException $exception) {
            $cause = $exception;
            while ($cause->getPrevious()) {
                $cause = $cause->getPrevious();
            }
            $this->assertInstanceOf(InvalidArgumentException::class, $cause);
            $this->assertStringContainsString($message, $cause->getMessage());

            return;
        }

        $this->fail('An unsupported component contract rendered without an error.');
    }

    private function document(string $html): DOMDocument
    {
        $document = new DOMDocument;
        $previous = libxml_use_internal_errors(true);
        try {
            $document->loadHTML($html);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        return $document;
    }
}
