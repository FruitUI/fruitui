<?php

namespace FruitUI\Tests;

use Illuminate\Support\Facades\Blade;
use Illuminate\View\Component;
use Illuminate\View\ViewException;

class AdoptionContractsTest extends TestCase
{
    public function test_field_associates_label_description_error_and_preserves_native_models(): void
    {
        $html = Blade::render('<x-fruit::field control-id="email" label="Email" description="Work address" error="Invalid"><x-fruit::input type="email" name="email" aria-describedby="existing" wire:model.blur="email" /></x-fruit::field>');
        $this->assertStringContainsString('for="email"', $html);
        $this->assertStringContainsString('id="email"', $html);
        $this->assertStringContainsString('aria-describedby="existing email-description email-error"', $html);
        $this->assertStringContainsString('aria-invalid="true"', $html);
        $this->assertStringContainsString('wire:model.blur="email"', $html);
        $this->assertStringContainsString('id="email-description"', $html);
        $this->assertStringContainsString('id="email-error"', $html);
    }

    public function test_enhanced_field_separates_wrapper_presentation_and_native_attributes(): void
    {
        $html = Blade::render('<x-fruit::field control-id="owner" label="Owner" description="Choose an agent"><x-fruit::combobox name="owner" wire:model="owner" :wrapper="[\'style\' => \'width:180px\', \'data-fruit-no-matches\' => \'Geen resultaten\']"><option>Alex</option></x-fruit::combobox></x-fruit::field>');
        $this->assertStringContainsString('data-fruit-no-matches="Geen resultaten"', $html);
        $this->assertMatchesRegularExpression('/<select(?=[^>]*wire:model="owner")(?=[^>]*id="owner")[^>]*>/s', $html);
        $this->assertStringContainsString('aria-describedby="owner-description"', $html);
    }

    public function test_field_defaults_do_not_inherit_unrelated_parent_component_props(): void
    {
        Blade::component(DescriptionScope::class, 'description-scope');
        $html = Blade::render('<x-description-scope description="Unrelated"><x-fruit::field control-id="name" label="Name"><x-fruit::input /></x-fruit::field></x-description-scope>');
        $this->assertStringContainsString('id="name"', $html);
        $this->assertStringNotContainsString('aria-describedby', $html);
    }

    public function test_editor_toolbar_slot_replaces_defaults_without_changing_its_value_owner(): void
    {
        $html = Blade::render('<x-fruit::editor name="signature"><x-slot:toolbar><button type="button" data-fruit-command="bold">Vet</button></x-slot:toolbar>&lt;p&gt;Hello&lt;/p&gt;</x-fruit::editor>');
        $this->assertStringContainsString('>Vet</button>', $html);
        $this->assertStringNotContainsString('data-fruit-command="italic"', $html);
        $this->assertMatchesRegularExpression('/<textarea[^>]*name="signature"/', $html);
    }

    public function test_wrapper_cannot_steal_native_bindings(): void
    {
        $this->expectException(ViewException::class);
        Blade::render('<x-fruit::combobox :wrapper="[\'wire:model\' => \'owner\']"><option>Alex</option></x-fruit::combobox>');
    }

    public function test_field_rejects_mismatched_control_identity(): void
    {
        $this->expectException(ViewException::class);
        Blade::render('<x-fruit::field control-id="email" label="Email"><x-fruit::input id="other" /></x-fruit::field>');
    }
}

class DescriptionScope extends Component
{
    public function __construct(public string $description) {}

    public function render()
    {
        return '<div>{{ $slot }}</div>';
    }
}
