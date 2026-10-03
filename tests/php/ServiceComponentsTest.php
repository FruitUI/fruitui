<?php

namespace FruitUI\Tests;

use DOMDocument;
use FruitUI\FruitUIServiceProvider;
use Illuminate\Support\Facades\Blade;
use Illuminate\View\ViewException;
use InvalidArgumentException;
use Livewire\Component;
use Livewire\Livewire;
use Livewire\LivewireServiceProvider;
use Orchestra\Testbench\TestCase;
use PHPUnit\Framework\Attributes\DataProvider;

class ServiceComponentsTest extends TestCase
{
    protected function getPackageProviders($app): array
    {
        return [LivewireServiceProvider::class, FruitUIServiceProvider::class];
    }

    protected function getEnvironmentSetUp($app): void
    {
        $app['config']->set('app.key', str_repeat('a', 32));
        $app['config']->set('session.driver', 'array');
    }

    #[DataProvider('controls')]
    public function test_enhanced_controls_keep_names_values_and_bindings_on_the_native_element(string $component, string $element, string $content): void
    {
        $html = Blade::render('<x-fruit::'.$component.' id="value" name="value" x-model="value" wire:model.live="value" required disabled aria-describedby="help">'.$content.'</x-fruit::'.$component.'>');
        $dom = new DOMDocument;
        @$dom->loadHTML($html);
        $control = $dom->getElementsByTagName($element)->item(0);
        foreach (['id' => 'value', 'name' => 'value', 'x-model' => 'value', 'wire:model.live' => 'value', 'aria-describedby' => 'help'] as $name => $value) {
            $this->assertSame($value, $control->getAttribute($name));
        }
        $this->assertTrue($control->hasAttribute('required'));
        $this->assertTrue($control->hasAttribute('disabled'));
        $this->assertTrue($control->hasAttribute('data-fruit-control'));
        $this->assertFalse($control->hasAttribute('hidden'));
        $this->assertFalse($control->parentNode->hasAttribute('name'));
        $this->assertFalse($control->parentNode->hasAttribute('wire:model.live'));
        $this->assertFalse($control->hasAttribute('wire:ignore'));
        $this->assertStringContainsString('wire:ignore', $html);
        if ($component === 'editor') {
            $this->assertSame('<p>Hello</p>', $control->textContent);
        }
    }

    public static function controls(): array
    {
        return [['combobox', 'select', '<option value="alex">Alex</option>'], ['token-field', 'textarea', 'alex@example.com'], ['editor', 'textarea', '&lt;p&gt;Hello&lt;/p&gt;']];
    }

    public function test_menu_and_tabs_keep_distinct_command_and_panel_semantics(): void
    {
        $html = Blade::render('<x-fruit::menu title="Reply options"><x-slot:trigger class="custom">Options</x-slot:trigger><x-fruit::menu-item type="button" role="menuitem" variant="danger" wire:click="delete" disabled>Delete</x-fruit::menu-item></x-fruit::menu><x-fruit::tabs aria-label="Details"><x-fruit::tab type="button" role="tab" id="profile" aria-controls="panel" aria-selected="true" x-on:click="select">Profile</x-fruit::tab></x-fruit::tabs>');
        $dom = new DOMDocument;
        @$dom->loadHTML($html);
        $buttons = $dom->getElementsByTagName('button');
        $this->assertSame('menuitem', $buttons->item(0)->getAttribute('role'));
        $this->assertSame('delete', $buttons->item(0)->getAttribute('wire:click'));
        $this->assertTrue($buttons->item(0)->hasAttribute('disabled'));
        $this->assertSame('tab', $buttons->item(1)->getAttribute('role'));
        $this->assertSame('select', $buttons->item(1)->getAttribute('x-on:click'));
        $this->assertStringContainsString('x-data="fruitMenu"', $html);
        $this->assertStringContainsString('role="menu"', $html);
        $this->assertStringContainsString('f-menu-item--danger', $html);
        $this->assertSame(2, substr_count($html, 'type="button"'));
    }

    public function test_alert_does_not_announce_static_content_unless_the_application_requests_it(): void
    {
        $html = Blade::render('<x-fruit::alert tone="danger">Delivery paused<x-slot:actions><x-fruit::button wire:click="retry">Retry</x-fruit::button></x-slot:actions></x-fruit::alert>');
        $this->assertStringNotContainsString('role="alert"', $html);
        $this->assertStringContainsString('f-alert--danger', $html);
        $this->assertStringContainsString('wire:click="retry"', $html);
        $this->assertStringContainsString('role="status"', Blade::render('<x-fruit::alert tone="success" role="status">Saved</x-fruit::alert>'));
    }

    #[DataProvider('invalidContracts')]
    public function test_semantic_changes_and_unknown_options_are_rejected(string $source): void
    {
        try {
            Blade::render($source);
            $this->fail('Expected contract rejection.');
        } catch (ViewException $error) {
            $cause = $error;
            while ($cause->getPrevious()) {
                $cause = $cause->getPrevious();
            } $this->assertInstanceOf(InvalidArgumentException::class, $cause);
        }
    }

    public static function invalidContracts(): array
    {
        return array_map(fn ($source) => [$source], [
            '<x-fruit::alert tone="urgent"/>', '<x-fruit::alert role="button"/>',
            '<x-fruit::menu x-data="other"/>', '<x-fruit::menu as="select"/>',
            '<x-fruit::menu-item variant="checkbox"/>', '<x-fruit::menu-item role="menuitemcheckbox"/>', '<x-fruit::menu-item type="submit"/>',
            '<x-fruit::combobox multiple/>', '<x-fruit::combobox size="3"/>', '<x-fruit::combobox x-bind:multiple.camel="many"/>', '<x-fruit::combobox hidden/>',
            '<x-fruit::token-field type="email"/>', '<x-fruit::token-field role="listbox"/>', '<x-fruit::editor x-bind:role.camel="role"/>',
            '<x-fruit::tab role="button"/>', '<x-fruit::tab type="submit"/>', '<x-fruit::tabs role="menu"/>',
            '<x-fruit::pagination as="div"/>', '<x-fruit::section-nav role="tablist"/>',
        ]);
    }

    public function test_livewire_receives_scalar_choices_and_serialized_token_and_html_values(): void
    {
        Livewire::test(ServiceBindingsFixture::class)
            ->assertSeeHtml('wire:model="assignee"')->assertSeeHtml('wire:model="recipients"')->assertSeeHtml('wire:model="signature"')
            ->set('assignee', 'mia')->set('recipients', "alex@example.com\nmia@example.com")->set('signature', '<p>Hello <strong>Sophie</strong></p>')
            ->call('save')->assertSet('saved', ['assignee' => 'mia', 'recipients' => "alex@example.com\nmia@example.com", 'signature' => '<p>Hello <strong>Sophie</strong></p>']);
    }
}

class ServiceBindingsFixture extends Component
{
    public string $assignee = 'alex';

    public string $recipients = '';

    public string $signature = '';

    public array $saved = [];

    public function save(): void
    {
        $this->saved = $this->validate(['assignee' => 'required|in:alex,mia', 'recipients' => 'required|string', 'signature' => 'required|string']);
    }

    public function render(): string
    {
        return Blade::render('<form wire:submit="save"><x-fruit::combobox wire:model="assignee"><option value="alex">Alex</option><option value="mia">Mia</option></x-fruit::combobox><x-fruit::token-field wire:model="recipients"/><x-fruit::editor wire:model="signature"/><x-fruit::button type="submit">Save</x-fruit::button></form>');
    }
}
